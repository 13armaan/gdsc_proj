import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
print("Key starts with:", api_key[:10])

url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
headers = {'Content-Type': 'application/json'}
data = {
    "contents": [{"parts":[{"text": "Hi"}]}]
}

response = requests.post(url, headers=headers, data=json.dumps(data))
print("Status:", response.status_code)
print("Response:", response.text)
