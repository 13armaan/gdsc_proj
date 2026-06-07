import os
from fastapi import APIRouter, HTTPException, Depends
# pyrefly: ignore [missing-import]
from sqlmodel import Session
from app.models.schemas import ScanRequest, ScanResponse, Node, Edge, SummaryRequest, SummaryResponse
from app.services.crawler import crawl_directory
from app.services.parsers.factory import ParserFactory
from app.services.ai_service import get_file_summary
from app.core.database import get_session

router = APIRouter()

@router.post("/api/scan", response_model=ScanResponse)
async def scan_repository(request: ScanRequest):
    if not os.path.exists(request.target_path) or not os.path.isdir(request.target_path):
        raise HTTPException(status_code=400, detail="Invalid target path")
        
    file_paths = await crawl_directory(request.target_path)
    
    nodes = []
    edges = []
    
    for file_path in file_paths:
        file_name = os.path.basename(file_path)
        nodes.append(Node(id=file_path, label=file_name, type="file"))
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception:
            continue
            
        _, ext = os.path.splitext(file_path)
        parser = ParserFactory.get_parser(ext)
        if parser:
            dependencies = parser.extract_dependencies(file_path, content)
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
                
    return ScanResponse(nodes=nodes, edges=edges)

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
