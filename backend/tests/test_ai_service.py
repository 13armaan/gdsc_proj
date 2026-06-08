import hashlib
import pytest
from unittest.mock import patch, AsyncMock
from sqlmodel import SQLModel, Session, create_engine, select
from app.models.cache import FileSummaryCache
from app.services.ai_service import get_file_summary

@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.mark.asyncio
@patch('app.services.ai_service.litellm.acompletion', new_callable=AsyncMock)
async def test_get_file_summary_cache_miss(mock_acompletion, session: Session):
    mock_response = AsyncMock()
    mock_response.choices = [AsyncMock()]
    mock_response.choices[0].message.content = "This is a mock summary."
    mock_acompletion.return_value = mock_response
    
    content = "print('hello world')\n# another line"
    file_path = "test.py"
    
    result = await get_file_summary(session, file_path, content)
    
    assert result["summary"] == "This is a mock summary."
    assert result["loc"] == 2
    mock_acompletion.assert_called_once()
    
    file_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
    cached = session.exec(select(FileSummaryCache).where(FileSummaryCache.file_hash == file_hash)).first()
    assert cached is not None
    assert cached.summary == "This is a mock summary."
    assert cached.loc == 2

@pytest.mark.asyncio
@patch('app.services.ai_service.litellm.acompletion', new_callable=AsyncMock)
async def test_get_file_summary_cache_hit(mock_acompletion, session: Session):
    content = "print('cached file')"
    file_path = "cached.py"
    file_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    cached_record = FileSummaryCache(
        file_hash=file_hash,
        summary="Cached summary.",
        loc=1
    )
    session.add(cached_record)
    session.commit()
    
    result = await get_file_summary(session, file_path, content)
    
    assert result["summary"] == "Cached summary."
    assert result["loc"] == 1
    mock_acompletion.assert_not_called()

@pytest.mark.asyncio
@patch('app.services.ai_service.litellm.acompletion', new_callable=AsyncMock)
async def test_get_file_summary_api_error(mock_acompletion, session: Session):
    mock_acompletion.side_effect = Exception("API Timeout")
    
    content = "error file"
    file_path = "error.py"
    
    result = await get_file_summary(session, file_path, content)
    
    assert result["summary"] == "AI Summary generation failed due to an unexpected API error."
    assert result["loc"] == 1
    mock_acompletion.assert_called_once()
    
    file_hash = hashlib.sha256(content.encode('utf-8')).hexdigest()
    cached = session.exec(select(FileSummaryCache).where(FileSummaryCache.file_hash == file_hash)).first()
    assert cached is None
