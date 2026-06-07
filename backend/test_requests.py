import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print("Key starts with:", api_key[:10])

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
response = requests.get(url)
print("Status:", response.status_code)
try:
    models = response.json().get("models", [])
    print("Available Models:")
    for m in models:
        print(f" - {m.get('name')} (supported methods: {m.get('supportedGenerationMethods')})")
except Exception as e:
    print("Response:", response.text)
