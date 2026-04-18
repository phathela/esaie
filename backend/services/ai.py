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
