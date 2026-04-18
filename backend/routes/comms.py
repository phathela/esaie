from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
import secrets
from database import get_db
from routes.auth import get_current_user
from ws_manager import manager
from services.ai import chat_completion

router = APIRouter()

# ── Models ──────────────────────────────────────────────────────────────────

class SendMessageRequest(BaseModel):
    to_user_id: str
    content: str

class CreateGroupRequest(BaseModel):
    name: str
    description: str = ""
    member_ids: list[str] = []

class GroupMessageRequest(BaseModel):
    group_id: str
    content: str

class CreateMeetingRequest(BaseModel):
    title: str
    description: str = ""
    scheduled_at: str
    duration_minutes: int = 60
    attendee_ids: list[str] = []

class CreateTaskRequest(BaseModel):
    title: str
    description: str = ""
    assigned_to: str = ""
    due_date: str = ""
    priority: str = "medium"

class UpdateTaskRequest(BaseModel):
    status: str

class RespondToMeetingInviteRequest(BaseModel):
    meeting_id: str
    response: str  # accepted, declined

class UploadMeetingDocumentRequest(BaseModel):
    meeting_id: str
    file_name: str
    file_url: str

class AddMeetingMinuteRequest(BaseModel):
    meeting_id: str
    content: str
    submitted_by: str = ""

class MeetingBoardItemRequest(BaseModel):
    meeting_id: str
    title: str
    description: str = ""
    status: str = "todo"  # todo, in_progress, review, done

class AIPalMessageRequest(BaseModel):
    pal_id: str
    message: str
    history: list = []

# ── WebSocket ────────────────────────────────────────────────────────────────

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)

# ── Chat ─────────────────────────────────────────────────────────────────────

@router.get("/chat/users/search")
async def search_users(q: str = "", current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    if not q:
        return {"users": []}
    cursor = db.users.find(
        {"$or": [{"username": {"$regex": q, "$options": "i"}}, {"name": {"$regex": q, "$options": "i"}}],
         "user_id": {"$ne": current_user["user_id"]}},
        {"password_hash": 0, "_id": 0}
    ).limit(10)
    users = await cursor.to_list(10)
    return {"users": users}

@router.get("/chat/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    cursor = db.conversations.find({"members": uid}).sort("last_message_at", -1).limit(50)
    convos = await cursor.to_list(50)
    result = []
    for c in convos:
        c.pop("_id", None)
        other_id = next((m for m in c["members"] if m != uid), None)
        if other_id:
            other = await db.users.find_one({"user_id": other_id}, {"password_hash": 0, "_id": 0})
            c["other_user"] = other
        c["online"] = other_id in manager.online_users()
        result.append(c)
    return {"conversations": result}

@router.get("/chat/messages/{other_user_id}")
async def get_messages(other_user_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    convo_id = "_".join(sorted([uid, other_user_id]))
    cursor = db.messages.find({"conversation_id": convo_id}, {"_id": 0}).sort("created_at", 1).limit(100)
    messages = await cursor.to_list(100)
    await db.messages.update_many({"conversation_id": convo_id, "to_id": uid, "read": False}, {"$set": {"read": True}})
    return {"messages": messages}

@router.post("/chat/send")
async def send_message(req: SendMessageRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    convo_id = "_".join(sorted([uid, req.to_user_id]))
    now = datetime.utcnow().isoformat()
    msg = {
        "message_id": "msg_" + secrets.token_hex(6),
        "conversation_id": convo_id,
        "from_id": uid,
        "to_id": req.to_user_id,
        "content": req.content,
        "read": False,
        "created_at": now,
    }
    await db.messages.insert_one(msg)
    await db.conversations.update_one(
        {"conversation_id": convo_id},
        {"$set": {"conversation_id": convo_id, "members": [uid, req.to_user_id], "last_message": req.content, "last_message_at": now, "last_sender": uid}},
        upsert=True,
    )
    msg.pop("_id", None)
    await manager.send(req.to_user_id, {"type": "new_message", "message": msg, "from_name": current_user["name"]})
    return {"message": msg}

# ── Groups ───────────────────────────────────────────────────────────────────

@router.post("/groups")
async def create_group(req: CreateGroupRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    members = list(set([uid] + req.member_ids))
    group = {
        "group_id": "grp_" + secrets.token_hex(6),
        "name": req.name,
        "description": req.description,
        "members": members,
        "admin_id": uid,
        "created_at": datetime.utcnow().isoformat(),
        "last_message": "",
        "last_message_at": datetime.utcnow().isoformat(),
    }
    await db.groups.insert_one(group)
    group.pop("_id", None)
    return {"group": group}

@router.get("/groups")
async def get_groups(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    cursor = db.groups.find({"members": uid}, {"_id": 0}).sort("last_message_at", -1)
    groups = await cursor.to_list(50)
    return {"groups": groups}

@router.get("/groups/{group_id}/messages")
async def get_group_messages(group_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    cursor = db.group_messages.find({"group_id": group_id}, {"_id": 0}).sort("created_at", 1).limit(100)
    messages = await cursor.to_list(100)
    return {"messages": messages}

@router.post("/groups/message")
async def send_group_message(req: GroupMessageRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    group = await db.groups.find_one({"group_id": req.group_id})
    if not group or uid not in group["members"]:
        raise HTTPException(403, "Not a member of this group")
    now = datetime.utcnow().isoformat()
    msg = {
        "message_id": "gmsg_" + secrets.token_hex(6),
        "group_id": req.group_id,
        "from_id": uid,
        "from_name": current_user["name"],
        "content": req.content,
        "created_at": now,
    }
    await db.group_messages.insert_one(msg)
    msg.pop("_id", None)
    await db.groups.update_one({"group_id": req.group_id}, {"$set": {"last_message": req.content, "last_message_at": now}})
    other_members = [m for m in group["members"] if m != uid]
    await manager.broadcast(other_members, {"type": "group_message", "message": msg, "group_name": group["name"]})
    return {"message": msg}

# ── Meetings ─────────────────────────────────────────────────────────────────

@router.post("/meetings")
async def create_meeting(req: CreateMeetingRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    meeting_id = "meet_" + secrets.token_hex(6)
    attendees = list(set([uid] + req.attendee_ids))
    now = datetime.utcnow().isoformat()
    meeting = {
        "meeting_id": meeting_id,
        "title": req.title,
        "description": req.description,
        "scheduled_at": req.scheduled_at,
        "duration_minutes": req.duration_minutes,
        "organizer_id": uid,
        "organizer_name": current_user["name"],
        "attendees": attendees,
        "attendee_responses": {},
        "join_link": f"https://meet.jit.si/esaie-{meeting_id}",
        "status": "scheduled",
        "created_at": now,
    }
    await db.meetings.insert_one(meeting)
    meeting.pop("_id", None)

    # Create invites for all attendees
    for att_id in attendees:
        invite = {
            "invite_id": "inv_" + secrets.token_hex(6),
            "meeting_id": meeting_id,
            "attendee_id": att_id,
            "response": "pending" if att_id != uid else "accepted",
            "responded_at": None if att_id != uid else now,
            "created_at": now,
        }
        await db.meeting_invites.insert_one(invite)
        if att_id != uid:
            await manager.send(att_id, {"type": "meeting_invite", "meeting": meeting})

    return {"meeting": meeting}

@router.get("/meetings")
async def get_meetings(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    cursor = db.meetings.find({"attendees": uid}, {"_id": 0}).sort("scheduled_at", 1)
    meetings = await cursor.to_list(50)
    return {"meetings": meetings}

@router.put("/meetings/{meeting_id}/status")
async def update_meeting_status(meeting_id: str, status: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.meetings.update_one({"meeting_id": meeting_id}, {"$set": {"status": status}})
    return {"ok": True}

@router.get("/meetings/{meeting_id}")
async def get_meeting_detail(meeting_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    meeting = await db.meetings.find_one({"meeting_id": meeting_id}, {"_id": 0})
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    # Get invites
    invites = await db.meeting_invites.find({"meeting_id": meeting_id}, {"_id": 0}).to_list(100)

    # Get board items
    board_items = await db.meeting_board_items.find({"meeting_id": meeting_id}, {"_id": 0}).sort("created_at", 1).to_list(100)

    # Get documents
    docs = await db.meeting_documents.find({"meeting_id": meeting_id}, {"_id": 0}).sort("created_at", -1).to_list(50)

    # Get minutes
    minutes = await db.meeting_minutes.find({"meeting_id": meeting_id}, {"_id": 0}).sort("created_at", 1).to_list(100)

    meeting["invites"] = invites
    meeting["board_items"] = board_items
    meeting["documents"] = docs
    meeting["minutes"] = minutes

    return {"meeting": meeting}

@router.post("/meetings/{meeting_id}/invites/respond")
async def respond_to_meeting_invite(meeting_id: str, req: RespondToMeetingInviteRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    invite = await db.meeting_invites.find_one({"meeting_id": meeting_id, "attendee_id": uid})
    if not invite:
        raise HTTPException(404, "Invite not found")

    now = datetime.utcnow().isoformat()
    await db.meeting_invites.update_one(
        {"meeting_id": meeting_id, "attendee_id": uid},
        {"$set": {"response": req.response, "responded_at": now}}
    )

    # Update meeting attendees status
    await db.meetings.update_one(
        {"meeting_id": meeting_id},
        {"$addToSet": {f"attendee_responses.{uid}": req.response}}
    )

    return {"ok": True, "response": req.response}

@router.get("/meetings/{meeting_id}/invites")
async def get_meeting_invites(meeting_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    invites = await db.meeting_invites.find({"meeting_id": meeting_id}, {"_id": 0}).to_list(100)
    return {"invites": invites}

@router.post("/meetings/{meeting_id}/board-items")
async def create_board_item(meeting_id: str, req: MeetingBoardItemRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    item = {
        "item_id": "item_" + secrets.token_hex(6),
        "meeting_id": meeting_id,
        "title": req.title,
        "description": req.description,
        "status": req.status,
        "created_by": current_user["user_id"],
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.meeting_board_items.insert_one(item)
    item.pop("_id", None)
    return {"item": item}

@router.put("/meetings/{meeting_id}/board-items/{item_id}")
async def update_board_item(meeting_id: str, item_id: str, req: MeetingBoardItemRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.meeting_board_items.update_one(
        {"item_id": item_id, "meeting_id": meeting_id},
        {"$set": {"status": req.status, "title": req.title, "description": req.description}}
    )
    return {"ok": True}

@router.post("/meetings/{meeting_id}/documents")
async def upload_meeting_document(meeting_id: str, req: UploadMeetingDocumentRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    doc = {
        "doc_id": "doc_" + secrets.token_hex(6),
        "meeting_id": meeting_id,
        "file_name": req.file_name,
        "file_url": req.file_url,
        "uploaded_by": current_user["user_id"],
        "uploaded_by_name": current_user["name"],
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.meeting_documents.insert_one(doc)
    doc.pop("_id", None)
    return {"document": doc}

@router.get("/meetings/{meeting_id}/documents")
async def get_meeting_documents(meeting_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    docs = await db.meeting_documents.find({"meeting_id": meeting_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"documents": docs}

@router.post("/meetings/{meeting_id}/minutes")
async def add_meeting_minute(meeting_id: str, req: AddMeetingMinuteRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    minute = {
        "minute_id": "min_" + secrets.token_hex(6),
        "meeting_id": meeting_id,
        "content": req.content,
        "submitted_by": req.submitted_by or current_user["user_id"],
        "submitted_by_name": current_user["name"],
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.meeting_minutes.insert_one(minute)
    minute.pop("_id", None)
    return {"minute": minute}

@router.get("/meetings/{meeting_id}/minutes")
async def get_meeting_minutes(meeting_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    minutes = await db.meeting_minutes.find({"meeting_id": meeting_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return {"minutes": minutes}

@router.post("/meetings/{meeting_id}/minutes/consolidate")
async def consolidate_meeting_minutes(meeting_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    meeting = await db.meetings.find_one({"meeting_id": meeting_id})
    if not meeting:
        raise HTTPException(404, "Meeting not found")

    minutes = await db.meeting_minutes.find({"meeting_id": meeting_id}, {"_id": 0}).to_list(100)
    if not minutes:
        return {"consolidated": ""}

    # Use AI to consolidate minutes
    from services.ai import chat_completion
    minutes_text = "\n".join([f"- {m['content']}" for m in minutes])
    prompt = f"""Consolidate the following meeting minutes into a clear, professional summary:

{minutes_text}

Provide a concise summary with key points, decisions, and action items."""

    consolidated = await chat_completion([{"role": "user", "content": prompt}])

    # Save consolidated minutes
    await db.meetings.update_one(
        {"meeting_id": meeting_id},
        {"$set": {"consolidated_minutes": consolidated, "consolidated_at": datetime.utcnow().isoformat()}}
    )

    return {"consolidated": consolidated}

# ── Meeting Chat ─────────────────────────────────────────────────────────────

@router.post("/meetings/{meeting_id}/chat")
async def send_meeting_message(meeting_id: str, content: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    msg = {
        "msg_id": "mmsg_" + secrets.token_hex(6),
        "meeting_id": meeting_id,
        "from_id": current_user["user_id"],
        "from_name": current_user["name"],
        "content": content,
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.meeting_messages.insert_one(msg)
    msg.pop("_id", None)
    return {"message": msg}

@router.get("/meetings/{meeting_id}/chat")
async def get_meeting_chat(meeting_id: str, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    messages = await db.meeting_messages.find({"meeting_id": meeting_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return {"messages": messages}

# ── Tasks ────────────────────────────────────────────────────────────────────

@router.post("/tasks")
async def create_task(req: CreateTaskRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    task = {
        "task_id": "task_" + secrets.token_hex(6),
        "title": req.title,
        "description": req.description,
        "created_by": current_user["user_id"],
        "assigned_to": req.assigned_to or current_user["user_id"],
        "due_date": req.due_date,
        "priority": req.priority,
        "status": "todo",
        "created_at": datetime.utcnow().isoformat(),
    }
    await db.tasks.insert_one(task)
    task.pop("_id", None)
    return {"task": task}

@router.get("/tasks")
async def get_tasks(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    cursor = db.tasks.find({"$or": [{"assigned_to": uid}, {"created_by": uid}]}, {"_id": 0}).sort("created_at", -1)
    tasks = await cursor.to_list(100)
    return {"tasks": tasks}

@router.put("/tasks/{task_id}")
async def update_task(task_id: str, req: UpdateTaskRequest, current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    await db.tasks.update_one({"task_id": task_id}, {"$set": {"status": req.status}})
    return {"ok": True}

# ── AI Pals ──────────────────────────────────────────────────────────────────

AI_PALS = [
    {"id": "aria", "name": "Aria", "role": "General Assistant", "icon": "🤖", "color": "violet",
     "system": "You are Aria, a helpful and friendly general AI assistant for ESAIE. Be concise, helpful, and professional."},
    {"id": "leo", "name": "Leo", "role": "Legal Advisor", "icon": "⚖️", "color": "blue",
     "system": "You are Leo, an AI legal advisor. Provide general legal guidance, help draft documents, and explain legal concepts. Always note you're not a licensed attorney."},
    {"id": "nova", "name": "Nova", "role": "Data Analyst", "icon": "📊", "color": "emerald",
     "system": "You are Nova, an AI data analyst. Help interpret data, suggest visualisations, identify trends, and explain statistical concepts clearly."},
    {"id": "max", "name": "Max", "role": "IT Support", "icon": "💻", "color": "orange",
     "system": "You are Max, an IT support AI. Help troubleshoot technical issues, explain technology concepts, and guide users through technical processes."},
]

@router.get("/ai-pals")
async def get_ai_pals():
    return {"pals": AI_PALS}

@router.post("/ai-pals/chat")
async def ai_pal_chat(req: AIPalMessageRequest, current_user: dict = Depends(get_current_user)):
    pal = next((p for p in AI_PALS if p["id"] == req.pal_id), None)
    if not pal:
        raise HTTPException(404, "AI Pal not found")
    messages = [{"role": "system", "content": pal["system"]}]
    messages += req.history[-10:]
    messages.append({"role": "user", "content": req.message})
    reply = await chat_completion(messages)
    return {"reply": reply, "pal_id": req.pal_id}

# ── Notifications ─────────────────────────────────────────────────────────────

@router.get("/notifications/summary")
async def notifications_summary(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    unread_msgs = await db.messages.count_documents({"to_id": uid, "read": False})
    my_groups = await db.groups.find({"members": uid}, {"group_id": 1}).to_list(200)
    group_ids = [g["group_id"] for g in my_groups]
    unread_group = await db.group_messages.count_documents({"group_id": {"$in": group_ids}, "from_id": {"$ne": uid}}) if group_ids else 0
    upcoming_meetings = await db.meetings.count_documents({"attendees": uid, "status": "scheduled"})
    pending_tasks = await db.tasks.count_documents({"assigned_to": uid, "status": "todo"})
    return {"unread_messages": unread_msgs, "unread_group_messages": unread_group, "upcoming_meetings": upcoming_meetings, "pending_tasks": pending_tasks}

@router.get("/notifications/unread-count")
async def unread_count(current_user: dict = Depends(get_current_user), db: AsyncIOMotorDatabase = Depends(get_db)):
    uid = current_user["user_id"]
    count = await db.messages.count_documents({"to_id": uid, "read": False})
    return {"count": count}

@router.get("/online-users")
async def get_online_users(current_user: dict = Depends(get_current_user)):
    return {"online": list(manager.online_users())}
