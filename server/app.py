import os, uuid
from flask import Flask, request, jsonify
from openai import OpenAI
from dotenv import load_dotenv
from rag import retrieve, assemble_context
from flask_cors import CORS
from werkzeug.utils import secure_filename
from parsers import extract_text 
from rag import add_document   

load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

deepseek_client = OpenAI(
    base_url="https://models.inference.ai.azure.com",
    api_key=os.getenv("GITHUB_TOKEN")  
)




os.makedirs("uploads", exist_ok=True)

@app.route("/upload", methods=["POST"])
def upload():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    f = request.files["file"]
    filename = secure_filename(f.filename)
    path = os.path.join("uploads", filename)
    f.save(path)

    doc_id = str(uuid.uuid4())[:8]

    text = extract_text(path)
    if not text.strip():
        return jsonify({"error": "No text extracted from file"}), 400

    chunks = add_document(doc_id=doc_id, source_name=filename, text=text)

    return jsonify({"status": "ok", "doc_id": doc_id, "chunks": chunks})

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json or {}
    user_message = data.get("message", "")

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        response = deepseek_client.chat.completions.create(
            model="DeepSeek-V3-0324",
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant."},
                {"role": "user", "content": user_message}
            ]
        )

        reply = response.choices[0].message.content

        return jsonify({
            "model_used": "DeepSeek-V3-0324",
            "reply": reply
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/query", methods=["POST"])
def query():
    data = request.get_json() or {}
    question = data.get("question", "").strip()
    if not question:
        return jsonify({"error": "question required"}), 400

    hits = retrieve(question, top_k=6)
    context = assemble_context(hits)

    response = deepseek_client.chat.completions.create(
        model="DeepSeek-V3-0324",
        messages=[
            {"role": "system", "content": "You are a helpful assistant. Use the provided context to answer."},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
        ]
    )

    reply = response.choices[0].message.content

    return jsonify({
        "answer": reply,
        "hits": hits
    })



if __name__ == "__main__":
    app.run(debug=True, port=5000)
