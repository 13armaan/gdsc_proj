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
    circular_imports: List[List[str]] = []
    heavy_nodes: dict[str, int] = {}
    unused_dependencies: List[str] = []
    package_stats: dict[str, int] = {}
    layers: dict[str, List[str]] = {}
    coupling_metrics: dict[str, dict] = {}
    violations: List[dict] = []
    monolithic_components: List[str] = []

class SummaryRequest(BaseModel):
    file_path: str

class SummaryResponse(BaseModel):
    summary: str
    loc: int
