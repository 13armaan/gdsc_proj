import os
import asyncio
# pyrefly: ignore [missing-import]
import litellm
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

load_dotenv()

async def test_models():
    models_to_test = ["gemini/gemini-1.5-flash", "gemini/gemini-1.5-pro", "gemini/gemini-pro"]
    for model in models_to_test:
        try:
            print(f"Testing {model}...")
            response = await litellm.acompletion(
                model=model,
                messages=[{"role": "user", "content": "Say hi"}]
            )
            print(f"Success for {model}: {response.choices[0].message.content}")
            return model
        except Exception as e:
            print(f"Failed for {model}: {e}")

if __name__ == "__main__":
    asyncio.run(test_models())
