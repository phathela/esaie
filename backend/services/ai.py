import os
from groq import AsyncGroq

_client: AsyncGroq = None

def get_client() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
    return _client

MODEL = "llama-3.3-70b-versatile"
FAST_MODEL = "llama-3.1-8b-instant"

async def chat_completion(messages: list, model: str = MODEL, max_tokens: int = 2048) -> str:
    client = get_client()
    resp = await client.chat.completions.create(
        model=model,
        messages=messages,
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content

async def translate_text(text: str, target_language: str) -> str:
    messages = [
        {"role": "system", "content": f"You are a professional translator. Translate the following text to {target_language}. Return ONLY the translated text, nothing else."},
        {"role": "user", "content": text},
    ]
    return await chat_completion(messages, model=FAST_MODEL)

async def analyze_document(content: str, question: str = None) -> str:
    if question:
        system = f"Answer this question about the document concisely and accurately: {question}"
    else:
        system = "You are a document analyst. Provide a structured summary with: 1) Key Points, 2) Main Topics, 3) Action Items (if any), 4) Overall Assessment."
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": content[:12000]},
    ]
    return await chat_completion(messages)

async def excel_nlq(data_summary: str, question: str) -> str:
    messages = [
        {"role": "system", "content": "You are a data analyst. Answer questions about spreadsheet data clearly and concisely. When relevant, suggest insights beyond what was asked."},
        {"role": "user", "content": f"Spreadsheet data:\n{data_summary}\n\nQuestion: {question}"},
    ]
    return await chat_completion(messages)

async def innovation_bot(conversation: list, context: str = "") -> str:
    system = """You are ESAIE's Innovation Assistant. Help employees:
- Develop and refine ideas
- Identify feasibility and impact
- Suggest similar successful innovations
- Provide structured feedback on ideas
Be encouraging, specific, and constructive."""
    if context:
        system += f"\n\nCurrent idea context:\n{context}"
    messages = [{"role": "system", "content": system}] + conversation
    return await chat_completion(messages)

async def hr_assistant(conversation: list) -> str:
    system = """You are ESAIE's HR Assistant. Help with:
- Performance review guidance
- Policy questions
- Career development advice
- Conflict resolution suggestions
Be professional, empathetic, and policy-aware."""
    messages = [{"role": "system", "content": system}] + conversation
    return await chat_completion(messages, model=FAST_MODEL)

REPORT_PROMPTS = {
    "Executive Summary": "Create a concise Executive Summary with: Key findings and main points, Critical insights and recommendations, Action items and next steps. Use clear headers and bullet points.",
    "Analysis/Assessment": "Provide a thorough Analysis/Assessment with: Detailed examination of the content, Strengths and weaknesses identified, Risk assessment, Opportunities and recommendations.",
    "Business Case": "Develop a comprehensive Business Case with: Problem statement and proposed solution, Cost-benefit analysis, ROI projections, Implementation timeline and risk mitigation strategies.",
    "Project Plan": "Create a detailed Project Plan with: Objectives, scope, and deliverables, Milestones and timeline with phases, Resource requirements and dependencies, Success criteria.",
    "Guideline": "Develop a clear Guideline document with: Purpose and scope, Step-by-step procedures, Best practices and Do's/Don'ts, FAQ section.",
    "Production Report": "Generate a Production Report with: Performance metrics and output analysis, Efficiency indicators and quality assessment, Issues and resolutions, Improvement recommendations.",
    "Plan": "Create a comprehensive Plan with: Objectives and strategy overview, Action items with owners and deadlines, Resources needed, Monitoring and evaluation criteria."
}

async def generate_document_report(content: str, report_type: str) -> str:
    prompt = REPORT_PROMPTS.get(report_type, REPORT_PROMPTS["Executive Summary"])
    messages = [
        {"role": "system", "content": f"You are an expert business analyst and report writer. {prompt} Use markdown formatting with ## headers and bullet points."},
        {"role": "user", "content": f"Generate a professional {report_type} from this content:\n\n{content[:12000]}"},
    ]
    return await chat_completion(messages, max_tokens=3000)

async def analyze_excel_data(stats_context: str) -> str:
    messages = [
        {"role": "system", "content": "You are an expert data analyst. Analyze this dataset and provide: 1) Key patterns and trends, 2) Statistical highlights (min/max/avg), 3) Notable correlations or anomalies, 4) Actionable insights and recommendations. Be concise and specific."},
        {"role": "user", "content": f"Analyze this spreadsheet:\n\n{stats_context}"},
    ]
    return await chat_completion(messages, max_tokens=2000)

async def detect_data_errors(data_preview: str, pre_detected: list) -> str:
    messages = [
        {"role": "system", "content": "You are a data quality expert. Identify errors, inconsistencies, and data quality issues. Be specific about columns/rows with problems. Format findings clearly."},
        {"role": "user", "content": f"Analyze for data quality issues:\n\nData preview:\n{data_preview}\n\nPre-detected issues: {pre_detected}"},
    ]
    return await chat_completion(messages)

async def generate_formula(description: str, context: str = "") -> str:
    messages = [
        {"role": "system", "content": "You are an Excel/spreadsheet expert. Provide: 1) The exact formula, 2) How it works, 3) Example usage, 4) Alternative approaches. Format the formula in a code block."},
        {"role": "user", "content": f"Generate an Excel formula for: {description}" + (f"\nContext: {context}" if context else "")},
    ]
    return await chat_completion(messages)

async def smart_files_chat(query: str, file_contexts: list) -> str:
    context_str = "\n\n".join([f"=== {f['filename']} ===\n{f['content'][:6000]}" for f in file_contexts])
    messages = [
        {"role": "system", "content": f"You are an AI assistant with access to the user's documents. Answer questions based ONLY on the document content below. Always cite which document your information comes from.\n\nDocuments:\n{context_str[:25000]}"},
        {"role": "user", "content": query},
    ]
    return await chat_completion(messages, max_tokens=2000)
