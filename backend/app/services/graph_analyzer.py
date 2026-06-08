from collections import defaultdict
from typing import List, Dict

def detect_circular_imports(edges: List[dict]) -> List[List[str]]:
    """
    Detect circular imports in the graph using Tarjan's Strongly Connected Components algorithm.
    edges: List of dictionaries with 'source' and 'target' keys.
    Returns: List of cycles, where each cycle is a list of node IDs.
    """
    graph = defaultdict(list)
    nodes = set()
    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        if source and target:
            graph[source].append(target)
            nodes.add(source)
            nodes.add(target)

    index = 0
    stack = []
    indices = {}
    lowlink = {}
    on_stack = set()
    sccs = []

    def strongconnect(v):
        nonlocal index
        indices[v] = index
        lowlink[v] = index
        index += 1
        stack.append(v)
        on_stack.add(v)

        for w in graph[v]:
            if w not in indices:
                strongconnect(w)
                lowlink[v] = min(lowlink[v], lowlink[w])
            elif w in on_stack:
                lowlink[v] = min(lowlink[v], indices[w])

        if lowlink[v] == indices[v]:
            scc = []
            while True:
                w = stack.pop()
                on_stack.remove(w)
                scc.append(w)
                if w == v:
                    break
            # A cycle exists if the SCC has more than 1 node, 
            # or if it has 1 node with a self-loop.
            if len(scc) > 1 or (len(scc) == 1 and scc[0] in graph[scc[0]]):
                sccs.append(scc)

    for v in nodes:
        if v not in indices:
            strongconnect(v)

    return sccs

def calculate_node_weights(nodes: List[dict], edges: List[dict]) -> Dict[str, int]:
    """
    Calculate the total number of descendants (direct and indirect) for each node.
    nodes: List of node dictionaries.
    edges: List of edge dictionaries with 'source' and 'target' keys.
    Returns: Dictionary mapping node_id to its descendant_count.
    """
    graph = defaultdict(list)
    node_ids = set()
    
    for n in nodes:
        node_id = n.get("id")
        if node_id:
            node_ids.add(node_id)
            
    for edge in edges:
        source = edge.get("source")
        target = edge.get("target")
        if source and target:
            graph[source].append(target)
            node_ids.add(source)
            node_ids.add(target)

    weights = {}
    for start_node in node_ids:
        # Run BFS to find all reachable nodes from start_node
        visited = set()
        queue = [start_node]
        while queue:
            current = queue.pop(0)
            for neighbor in graph[current]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(neighbor)
        
        # descendant count is number of unique visited nodes
        weights[start_node] = len(visited)

    return weights
