import os
from fastapi import APIRouter, HTTPException, Depends
# pyrefly: ignore [missing-import]
from sqlmodel import Session
from app.models.schemas import ScanRequest, ScanResponse, Node, Edge, SummaryRequest, SummaryResponse
from app.services.crawler import crawl_directory
from app.services.parsers.factory import ParserFactory
from app.services.ai_service import get_file_summary
from app.core.database import get_session
from app.services.graph_analyzer import detect_circular_imports, calculate_node_weights
from app.services.architecture_analyzer import calculate_coupling_metrics
from app.services.package_tracker import parse_manifests, analyze_package_usage

router = APIRouter()

@router.post("/api/scan", response_model=ScanResponse)
async def scan_repository(request: ScanRequest):
    if not os.path.exists(request.target_path) or not os.path.isdir(request.target_path):
        raise HTTPException(status_code=400, detail="Invalid target path")
        
    file_paths = await crawl_directory(request.target_path)
    
    nodes = []
    edges = []
    all_extracted_imports = []
    
    for file_path in file_paths:
        file_name = os.path.basename(file_path)
        nodes.append(Node(id=file_path, label=file_name, type="file"))
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                nodes[-1].loc = len(content.splitlines())
        except Exception:
            pass
            
        _, ext = os.path.splitext(file_path)
        parser = ParserFactory.get_parser(ext)
        if parser:
            dependencies = parser.extract_dependencies(file_path, content)
            all_extracted_imports.extend(dependencies)
            for dep in dependencies:
                # Resolve module name (e.g. 'app.models.schemas') to file path suffix
                dep_path_unix = dep.replace(".", "/") + ".py"
                dep_path_win = dep.replace(".", "\\") + ".py"
                
                target_file_path = None
                for p in file_paths:
                    if p.endswith(dep_path_unix) or p.endswith(dep_path_win):
                        target_file_path = p
                        break
                
                if target_file_path:
                    # Edge.source is the dependent file, Edge.target is the imported file.
                    edge_id = f"{file_path}-{target_file_path}"
                    edges.append(Edge(id=edge_id, source=file_path, target=target_file_path))
                    
    # Graph Analysis
    edges_dict = [{"source": e.source, "target": e.target} for e in edges]
    nodes_dict = [{"id": n.id, "label": n.label, "type": n.type, "loc": n.loc} for n in nodes]
    
    circular_imports = detect_circular_imports(edges_dict)
    heavy_nodes = calculate_node_weights(nodes_dict, edges_dict)
    
    # Architecture Analysis
    arch_analysis = calculate_coupling_metrics(nodes_dict, edges_dict)
    layers = {}
    coupling_metrics = {}
    
    for layer_name, data in arch_analysis.get("modules", {}).items():
        layers[layer_name] = data["files"]
        coupling_metrics[layer_name] = {
            "afferent": data["Ca"],
            "efferent": data["Ce"],
            "instability": data["I"]
        }
        
    violations = [
        {"type": "bidirectional_coupling", "layers": pair}
        for pair in arch_analysis.get("tightly_coupled_pairs", [])
    ]
    
    monolithic_components = [
        n["id"] for n in nodes_dict 
        if heavy_nodes.get(n["id"], 0) > 5 or (n.get("loc") is not None and n.get("loc", 0) > 300)
    ]
    
    # Package Tracking
    declared_packages = parse_manifests(request.target_path)
    if declared_packages:
        package_analysis = analyze_package_usage(declared_packages, all_extracted_imports)
        unused_dependencies = package_analysis.get("unused_dependencies", [])
        package_stats = package_analysis.get("usage_stats", {})
    else:
        unused_dependencies = []
        package_stats = {}
                
    return ScanResponse(
        nodes=nodes, 
        edges=edges,
        circular_imports=circular_imports,
        heavy_nodes=heavy_nodes,
        unused_dependencies=unused_dependencies,
        package_stats=package_stats,
        layers=layers,
        coupling_metrics=coupling_metrics,
        violations=violations,
        monolithic_components=monolithic_components
    )

@router.post("/api/summary", response_model=SummaryResponse)
async def get_summary(request: SummaryRequest, session: Session = Depends(get_session)):
    if not os.path.exists(request.file_path) or not os.path.isfile(request.file_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    try:
        with open(request.file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")
        
    result = await get_file_summary(session, request.file_path, content)
    return SummaryResponse(**result)
