from datetime import datetime, timezone
from typing import Optional
# pyrefly: ignore [missing-import]
from sqlmodel import SQLModel, Field

class FileSummaryCache(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    file_hash: str = Field(index=True, unique=True)
    summary: str
    loc: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
