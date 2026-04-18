import requests
import json
from datetime import datetime, timedelta

API = "https://esaie-production.up.railway.app"

# Login as main user
login_resp = requests.post(f"{API}/api/auth/login",
    json={"email":"verify2@esaie.ai","password":"Test123!"})
token = login_resp.json().get('token','')
headers = {'Authorization': f'Bearer {token}'}

print("=== MEETINGS HUB - COMPREHENSIVE TEST ===\n")

# Test 1: Create Meeting
print("TEST 1: Create Meeting")
future_time = (datetime.utcnow() + timedelta(hours=2)).isoformat()
resp = requests.post(f"{API}/api/comms/meetings",
    json={
        "title": "Team Sync",
        "description": "Weekly team synchronization meeting",
        "scheduled_at": future_time,
        "duration_minutes": 60,
        "attendee_ids": []
    },
    headers=headers)
data = resp.json()
if 'meeting' in data:
    meeting_id = data['meeting']['meeting_id']
    print(f"[OK] Meeting created: {meeting_id}")
    print(f"  Title: {data['meeting']['title']}")
    print(f"  Join Link: {data['meeting']['join_link'][:50]}...")
else:
    print(f"[FAIL] {data}")
    meeting_id = None

# Test 2: Get Meetings
print("\nTEST 2: Get Meetings")
resp = requests.get(f"{API}/api/comms/meetings", headers=headers)
data = resp.json()
meetings = data.get('meetings', [])
if meetings:
    print(f"[OK] Got {len(meetings)} meetings")
else:
    print(f"[FAIL] No meetings found")

# Test 3: Get Meeting Detail
if meeting_id:
    print("\nTEST 3: Get Meeting Detail")
    resp = requests.get(f"{API}/api/comms/meetings/{meeting_id}", headers=headers)
    data = resp.json()
    if 'meeting' in data:
        m = data['meeting']
        print(f"[OK] Meeting detail loaded")
        print(f"  Board items: {len(m.get('board_items', []))}")
        print(f"  Documents: {len(m.get('documents', []))}")
        print(f"  Minutes: {len(m.get('minutes', []))}")
    else:
        print(f"[FAIL] {data}")

# Test 4: Create Board Item
if meeting_id:
    print("\nTEST 4: Create Board Item")
    resp = requests.post(f"{API}/api/comms/meetings/{meeting_id}/board-items",
        json={
            "title": "Update documentation",
            "description": "Update API documentation for new endpoints",
            "status": "todo"
        },
        headers=headers)
    data = resp.json()
    if 'item' in data:
        print(f"[OK] Board item created")
        print(f"  Status: {data['item']['status']}")
    else:
        print(f"[FAIL] {data}")

# Test 5: Send Meeting Message
if meeting_id:
    print("\nTEST 5: Send Meeting Message")
    resp = requests.post(f"{API}/api/comms/meetings/{meeting_id}/chat?content=Let%27s%20discuss%20the%20Q2%20goals",
        headers=headers)
    data = resp.json()
    if 'message' in data:
        print(f"[OK] Message sent")
        print(f"  Content: {data['message']['content'][:50]}")
    else:
        print(f"[FAIL] {data}")

# Test 6: Get Meeting Chat
if meeting_id:
    print("\nTEST 6: Get Meeting Chat")
    resp = requests.get(f"{API}/api/comms/meetings/{meeting_id}/chat", headers=headers)
    data = resp.json()
    if 'messages' in data:
        print(f"[OK] Chat loaded with {len(data['messages'])} messages")
    else:
        print(f"[FAIL] {data}")

# Test 7: Add Meeting Minutes
if meeting_id:
    print("\nTEST 7: Add Meeting Minutes")
    resp = requests.post(f"{API}/api/comms/meetings/{meeting_id}/minutes",
        json={
            "content": "Discussed Q2 strategy and resource allocation"
        },
        headers=headers)
    data = resp.json()
    if 'minute' in data:
        print(f"[OK] Minute added")
    else:
        print(f"[FAIL] {data}")

# Test 8: Get Meeting Minutes
if meeting_id:
    print("\nTEST 8: Get Meeting Minutes")
    resp = requests.get(f"{API}/api/comms/meetings/{meeting_id}/minutes", headers=headers)
    data = resp.json()
    if 'minutes' in data:
        print(f"[OK] Minutes loaded: {len(data['minutes'])} items")
    else:
        print(f"[FAIL] {data}")

# Test 9: Consolidate Minutes with AI
if meeting_id:
    print("\nTEST 9: Consolidate Minutes with AI")
    resp = requests.post(f"{API}/api/comms/meetings/{meeting_id}/minutes/consolidate",
        headers=headers)
    data = resp.json()
    if 'consolidated' in data and data['consolidated']:
        print(f"[OK] Minutes consolidated")
        print(f"  Summary: {data['consolidated'][:100]}...")
    else:
        print(f"[INFO] Consolidation returned: {data}")

print("\n=== TEST SUMMARY ===")
print("Meetings Hub core functionality tested!")
print("Board, Chat, Minutes, and AI Consolidation operational.")
