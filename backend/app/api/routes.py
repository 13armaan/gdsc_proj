import os
import tkinter as tk
from tkinter import filedialog
import asyncio
from fastapi import APIRouter, HTTPException, Depends
# pyrefly: ignore [missing-import]
from sqlmodel import Session
from app.models.schemas import ScanRequest, ScanResponse, Node, Edge, SummaryRequest, SummaryResponse, GraphData
from app.services.crawler import crawl_directory
from app.services.parsers.factory import ParserFactory
from app.services.ai_service import get_file_summary
from app.core.database import get_session
from app.services.graph_analyzer import detect_circular_imports, calculate_node_weights
from app.services.architecture_analyzer import calculate_coupling_metrics
from app.services.package_tracker import parse_manifests, analyze_package_usage
from app.services.metrics_analyzer import calculate_file_metrics, aggregate_statistics
from app.services.git_analyzer import get_git_metadata
from app.services.graph_aggregator import aggregate_graph

router = APIRouter()



@router.post("/api/scan", response_model=ScanResponse)
async def scan_repository(request: ScanRequest):
    if not os.path.exists(request.target_path) or not os.path.isdir(request.target_path):
        raise HTTPException(status_code=400, detail="Invalid target path")
        
    file_paths = await crawl_directory(request.target_path)
    
    file_metrics_list = calculate_file_metrics(file_paths)
    metrics_by_path = {m["file_path"]: m for m in file_metrics_list}
    
    nodes = []
    edges = []
    all_extracted_imports = []
    
    for file_path in file_paths:
        file_name = os.path.basename(file_path)
        
        m = metrics_by_path.get(file_path, {})
        loc = m.get("loc", 0)
        
        nodes.append(Node(
            id=file_path, 
            label=file_name, 
            type="file",
            loc=loc
        ))
        
        _, ext = os.path.splitext(file_path)
        parser = ParserFactory.get_parser(ext)
        if parser:
            content = ""
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
            except Exception:
                pass
            dependencies = parser.extract_dependencies(file_path, content)
            
            for dep_obj in dependencies:
                dep_target = dep_obj.get("target")
                dep_statement = dep_obj.get("statement", "import")
                
                if not dep_target:
                    continue
                    
                all_extracted_imports.append(dep_target)
                
                # Resolve module name (e.g. 'app.models.schemas') to file path suffix
                dep_path_unix = dep_target.replace(".", "/") + ".py"
                dep_path_win = dep_target.replace(".", "\\") + ".py"
                
                target_file_path = None
                for p in file_paths:
                    if p.endswith(dep_path_unix) or p.endswith(dep_path_win):
                        target_file_path = p
                        break
                
                if target_file_path:
                    # Edge.source is the dependent file, Edge.target is the imported file.
                    edge_id = f"{file_path}-{target_file_path}"
                    edges.append(Edge(id=edge_id, source=file_path, target=target_file_path, statement=dep_statement))
                    
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
                
    # Statistics & Git Metadata
    file_metrics = calculate_file_metrics(file_paths)
    aggregated_stats = aggregate_statistics(file_metrics)
    git_metadata = get_git_metadata(request.target_path)
    
    codebase_statistics = {
        "language_distribution": aggregated_stats["language_distribution"],
        "largest_files": aggregated_stats["top_10_largest_files"],
        "complex_files": aggregated_stats["top_10_most_complex_files"],
        "average_file_size_bytes": aggregated_stats["average_file_size"],
        "contribution_heatmap": git_metadata.get("contribution_heatmap", {}),
        "growth_history": git_metadata.get("growth_history", {})
    }

    # Graph Aggregation
    file_graph = GraphData(nodes=nodes, edges=edges)
    folder_graph = aggregate_graph(nodes, edges, request.target_path, "folder")
    module_graph = aggregate_graph(nodes, edges, request.target_path, "module")
    
    graphs = {
        "file": file_graph,
        "folder": folder_graph,
        "module": module_graph
    }

    return ScanResponse(
        graphs=graphs,
        circular_imports=circular_imports,
        heavy_nodes=heavy_nodes,
        unused_dependencies=unused_dependencies,
        package_stats=package_stats,
        layers=layers,
        coupling_metrics=coupling_metrics,
        violations=violations,
        monolithic_components=monolithic_components,
        statistics=codebase_statistics
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
