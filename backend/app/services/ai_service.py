import hashlib
import logging
import os
# pyrefly: ignore [missing-import]
import litellm
# pyrefly: ignore [missing-import]
from sqlmodel import Session, select
from app.models.cache import FileSummaryCache

logger = logging.getLogger(__name__)

async def get_file_summary(session: Session, file_path: str, content: str) -> dict:
    file_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
    loc = len(content.splitlines())
    
    statement = select(FileSummaryCache).where(FileSummaryCache.file_hash == file_hash)
    cached_record = session.exec(statement).first()
    
    if cached_record:
        return {"summary": cached_record.summary, "loc": cached_record.loc}
        
    system_prompt = "You are a senior developer. Explain what this code does in exactly 3 simple sentences. Focus on its core responsibility."
    user_prompt = f"[File Path: {file_path}]\n\n{content}"
    
    model_name = os.getenv("LITELLM_MODEL", "gpt-3.5-turbo")
    
    try:
        response = await litellm.acompletion(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
        )
        summary_text = response.choices[0].message.content.strip()
        
        new_record = FileSummaryCache(
            file_hash=file_hash,
            summary=summary_text,
            loc=loc
        )
        session.add(new_record)
        session.commit()
        session.refresh(new_record)
        
        return {"summary": summary_text, "loc": loc}
        
    except Exception as e:
        logger.warning(f"LLM API error for {file_path}: {e}")
        return {
            "summary": "Summary unavailable at this time.",
            "loc": loc
        }
