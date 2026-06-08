import os
from collections import defaultdict
from app.models.schemas import Node, Edge, GraphData

def _get_folder_path(file_path: str) -> str:
    return os.path.dirname(file_path)

def _get_module_name(file_path: str, target_path: str) -> str:
    """
    Resolves the top-level directory name inside the target_path.
    Files sitting directly in the root map to 'root'.
    """
    try:
        rel_path = os.path.relpath(file_path, target_path)
    except ValueError:
        return "root"
    
    parts = rel_path.replace("\\", "/").split("/")
    if len(parts) > 1:
        return parts[0]
    return "root"

def aggregate_graph(nodes: list[Node], edges: list[Edge], target_path: str, level: str) -> GraphData:
    """
    Aggregate the file-level graph to the specified level ('folder' or 'module').
    """
    node_mapping = {}  # maps original file_id to new aggregated_id
    agg_nodes = {}     # new_id -> Node
    agg_edges = defaultdict(int)  # (source_agg_id, target_agg_id) -> weight
    
    # 1. Map and aggregate nodes
    for node in nodes:
        if level == "folder":
            agg_id = _get_folder_path(node.id)
            label = os.path.basename(agg_id) if agg_id != target_path else "root"
        elif level == "module":
            agg_id = _get_module_name(node.id, target_path)
            label = agg_id
        else:
            return GraphData(nodes=nodes, edges=edges)
            
        node_mapping[node.id] = agg_id
        
        if agg_id not in agg_nodes:
            agg_nodes[agg_id] = Node(id=agg_id, label=label, type=level, loc=0)
            
        # Sum LOC
        if node.loc is not None:
            if agg_nodes[agg_id].loc is None:
                agg_nodes[agg_id].loc = 0
            agg_nodes[agg_id].loc += node.loc

    # 2. Map and aggregate edges
    for edge in edges:
        source_agg = node_mapping.get(edge.source)
        target_agg = node_mapping.get(edge.target)
        
        # Don't create self-loops for the same aggregated component
        if source_agg and target_agg and source_agg != target_agg:
            agg_edges[(source_agg, target_agg)] += edge.weight

    # 3. Format output
    result_nodes = list(agg_nodes.values())
    result_edges = []
    
    for (source, target), weight in agg_edges.items():
        edge_id = f"{source}-{target}"
        result_edges.append(Edge(id=edge_id, source=source, target=target, weight=weight, statement=""))
        
    return GraphData(nodes=result_nodes, edges=result_edges)
