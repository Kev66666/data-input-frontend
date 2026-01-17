import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:5500", "http://localhost:5500"]}})

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

@app.post("/summary")
def summary():
    payload = request.get_json(force=True)

    dates = payload.get("dates", [])
    sleep = payload.get("sleep", [])
    study = payload.get("study", [])
    exercise = payload.get("exercise", [])

    prompt = f"""
Summarize the user's weekly trends based on the data.
Write 4-6 short bullet points. Mention consistency, increases/decreases,
and 1 gentle suggestion.

Dates: {dates}
Study (hours): {study}
Exercise (hours): {exercise}
Sleep (hours): {sleep}
"""

    resp = client.responses.create(
        model="gpt-4.1-mini",
        input=prompt
    )

    return jsonify({"summary": resp.output_text})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=True)
