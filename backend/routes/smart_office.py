from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import secrets, io
from database import get_db
from routes.auth import get_current_user
from services.ai import translate_text, analyze_document, excel_nlq
from services.transcription import upload_audio, transcribe_url

router = APIRouter()

class TranslateRequest(BaseModel):
    text: str
    target_language: str
    source_language: str = "auto"

class ExcelQueryRequest(BaseModel):
    file_id: str
    question: str

class DocumentQueryRequest(BaseModel):
    file_id: str
    question: str = ""

# ── Translate ────────────────────────────────────────────────────────────────

@router.post("/smart-office/translate")
async def translate(req: TranslateRequest, current_user: dict = Depends(get_current_user)):
    result = await translate_text(req.text, req.target_language)
    return {"translated": result, "source": req.text, "target_language": req.target_language}

# ── Documents ─────────────────────────────────────────────────────────────────

@router.post("/smart-office/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    content = await file.read()
    text_content = ""

    if file.filename.endswith(".pdf"):
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(content))
            text_content = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception:
            text_content = content.decode("utf-8", errors="ignore")
    else:
        text_content = content.decode("utf-8", errors="ignore")

    analysis = await analyze_document(text_content)
    file_id = "doc_" + secrets.token_hex(6)
    doc = {
        "file_id": file_id,
        "filename": file.filename,
        "owner_id": current_user["user_id"],
        "content": text_content[:50000],
        "analysis": analysis,
        "size": len(content),
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.documents.insert_one(doc)
    doc.pop("_id", None)
    doc.pop("content", None)
    return {"file_id": file_id, "filename": file.filename, "analysis": analysis}

@router.post("/smart-office/documents/query")
async def query_document(req: DocumentQueryRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = await db.documents.find_one({"file_id": req.file_id, "owner_id": current_user["user_id"]})
    if not doc:
        raise HTTPException(404, "Document not found")
    answer = await analyze_document(doc["content"], req.question)
    return {"answer": answer, "question": req.question}

@router.get("/smart-office/documents")
async def list_documents(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    cursor = db.documents.find({"owner_id": current_user["user_id"]}, {"_id": 0, "content": 0}).sort("created_at", -1)
    docs = await cursor.to_list(100)
    return {"documents": docs}

@router.delete("/smart-office/documents/{file_id}")
async def delete_document(file_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.documents.delete_one({"file_id": file_id, "owner_id": current_user["user_id"]})
    return {"ok": True}

# ── Excel NLQ ─────────────────────────────────────────────────────────────────

@router.post("/smart-office/excel/upload")
async def upload_excel(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    import openpyxl
    content = await file.read()
    wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
    sheets_data = {}
    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        rows = []
        for row in ws.iter_rows(max_row=200, values_only=True):
            if any(cell is not None for cell in row):
                rows.append([str(c) if c is not None else "" for c in row])
        sheets_data[sheet_name] = rows

    summary_lines = []
    for sheet, rows in sheets_data.items():
        summary_lines.append(f"Sheet: {sheet} ({len(rows)} rows)")
        if rows:
            summary_lines.append("Headers: " + ", ".join(rows[0]))
            summary_lines.append("Sample (first 5 rows):")
            for r in rows[1:6]:
                summary_lines.append("  " + " | ".join(r))

    data_summary = "\n".join(summary_lines)
    file_id = "xl_" + secrets.token_hex(6)
    await db.excel_files.insert_one({
        "file_id": file_id,
        "filename": file.filename,
        "owner_id": current_user["user_id"],
        "data_summary": data_summary,
        "sheet_count": len(wb.sheetnames),
        "created_at": datetime.utcnow().isoformat(),
    })
    return {"file_id": file_id, "filename": file.filename, "sheets": list(wb.sheetnames), "summary": data_summary[:500]}

@router.post("/smart-office/excel/query")
async def query_excel(req: ExcelQueryRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    xfile = await db.excel_files.find_one({"file_id": req.file_id, "owner_id": current_user["user_id"]})
    if not xfile:
        raise HTTPException(404, "File not found")
    answer = await excel_nlq(xfile["data_summary"], req.question)
    return {"answer": answer, "question": req.question}

@router.get("/smart-office/excel/files")
async def list_excel_files(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    cursor = db.excel_files.find({"owner_id": current_user["user_id"]}, {"_id": 0, "data_summary": 0}).sort("created_at", -1)
    files = await cursor.to_list(50)
    return {"files": files}

# ── Transcribe ────────────────────────────────────────────────────────────────

@router.post("/smart-office/transcribe")
async def transcribe_audio(
    file: UploadFile = File(...),
    language: str = Form(default="en"),
    current_user: dict = Depends(get_current_user)
):
    content = await file.read()
    audio_url = await upload_audio(content)
    result = await transcribe_url(audio_url, language_code=language)
    return result

# ── Smart Files ───────────────────────────────────────────────────────────────

@router.get("/smart-office/files/list")
async def list_files(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    docs_cursor = db.documents.find({"owner_id": uid}, {"_id": 0, "content": 0}).sort("created_at", -1).limit(20)
    xl_cursor = db.excel_files.find({"owner_id": uid}, {"_id": 0, "data_summary": 0}).sort("created_at", -1).limit(20)
    docs = await docs_cursor.to_list(20)
    xls = await xl_cursor.to_list(20)
    for d in docs:
        d["type"] = "document"
    for x in xls:
        x["type"] = "excel"
    all_files = sorted(docs + xls, key=lambda f: f.get("created_at", ""), reverse=True)
    return {"files": all_files}
