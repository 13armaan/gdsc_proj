from pydantic import BaseModel
from typing import List, Optional, Dict, Any

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
    statement: str = "import"
    weight: int = 1

class GraphData(BaseModel):
    nodes: List[Node]
    edges: List[Edge]

class ScanResponse(BaseModel):
    graphs: Dict[str, GraphData]
    circular_imports: List[List[str]] = []
    heavy_nodes: dict[str, int] = {}
    unused_dependencies: List[str] = []
    package_stats: dict[str, int] = {}
    layers: dict[str, List[str]] = {}
    coupling_metrics: dict[str, dict] = {}
    violations: List[dict] = []
    monolithic_components: List[str] = []
    statistics: Optional['CodebaseStatistics'] = None

class CodebaseStatistics(BaseModel):
    language_distribution: dict[str, int]
    largest_files: List[dict]
    complex_files: List[dict]
    average_file_size_bytes: float
    contribution_heatmap: dict
    growth_history: dict

class SummaryRequest(BaseModel):
    file_path: str

class SummaryResponse(BaseModel):
    summary: str
    loc: int
