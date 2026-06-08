import os
from typing import List, Dict, Any, Tuple

def detect_modules_and_layers(nodes: List[Dict[str, Any]]) -> Dict[str, List[str]]:
    """
    Groups file paths by their top-level or secondary directories to identify
    high-level architectural layers/modules.
    """
    paths = [n.get("id") for n in nodes if n.get("id")]
    if not paths:
        return {}
        
    try:
        # If there are valid paths, find the deepest common directory
        common_root = os.path.commonpath(paths)
        # If the common_root is exactly one of the files, we want its directory
        if os.path.isfile(common_root) or len(paths) == 1:
            common_root = os.path.dirname(common_root)
    except ValueError:
        common_root = ""
        
    layers = {}
    for p in paths:
        if common_root:
            try:
                rel_path = os.path.relpath(p, common_root)
            except ValueError:
                rel_path = p
        else:
            rel_path = p
            
        dir_name = os.path.dirname(rel_path).replace("\\", "/")
        
        if not dir_name or dir_name == ".":
            layer = "root"
        else:
            # Take up to top 2 levels of directories
            parts = [part for part in dir_name.split("/") if part]
            layer = "/".join(parts[:2])
            
        if layer not in layers:
            layers[layer] = []
        layers[layer].append(p)
        
    return layers

def calculate_coupling_metrics(nodes: List[Dict[str, Any]], edges: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Evaluates coupling metrics (Ca, Ce, Instability) for architectural layers
    and identifies tightly coupled modules.
    """
    layers = detect_modules_and_layers(nodes)
    
    file_to_layer = {}
    for layer_name, files in layers.items():
        for f in files:
            file_to_layer[f] = layer_name
            
    # Track which layers a given layer depends on (Efferent)
    layer_dependencies = {layer: set() for layer in layers}
    # Track which layers depend on a given layer (Afferent)
    layer_dependents = {layer: set() for layer in layers}
    
    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        
        if not source or not target:
            continue
            
        source_layer = file_to_layer.get(source)
        target_layer = file_to_layer.get(target)
        
        if source_layer and target_layer and source_layer != target_layer:
            # source depends on target
            layer_dependencies[source_layer].add(target_layer)
            layer_dependents[target_layer].add(source_layer)
            
    modules_analysis = {}
    tightly_coupled_pairs = set()
    
    for layer in layers:
        ca = len(layer_dependents[layer])
        ce = len(layer_dependencies[layer])
        
        if ca + ce == 0:
            instability = 0.0
        else:
            instability = ce / (ca + ce)
            
        modules_analysis[layer] = {
            "files": layers[layer],
            "Ca": ca,
            "Ce": ce,
            "I": round(instability, 4)
        }
        
        # Check bidirectional dependencies for tight coupling
        for target_layer in layer_dependencies[layer]:
            if layer in layer_dependencies[target_layer]:
                # Found bidirectional coupling
                pair = tuple(sorted([layer, target_layer]))
                tightly_coupled_pairs.add(pair)
                
    return {
        "modules": modules_analysis,
        "tightly_coupled_pairs": [list(pair) for pair in tightly_coupled_pairs]
    }
