from pydantic import BaseModel
from typing import List, Optional

class ScanRequest(BaseModel):
    target_path: str

class Node(BaseModel):
    id: str
    label: str
    type: str
    loc: Optional[int] = None

class Edge(BaseModel):
    id: str
    source: str
    target: str

class ScanResponse(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

class SummaryRequest(BaseModel):
    file_path: str

class SummaryResponse(BaseModel):
    summary: str
    loc: int
