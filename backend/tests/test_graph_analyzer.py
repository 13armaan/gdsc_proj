import pytest
from app.services.graph_analyzer import detect_circular_imports, calculate_node_weights

def test_detect_circular_imports_no_cycle():
    edges = [
        {"source": "A", "target": "B"},
        {"source": "B", "target": "C"}
    ]
    cycles = detect_circular_imports(edges)
    assert cycles == []

def test_detect_circular_imports_simple_cycle():
    edges = [
        {"source": "A", "target": "B"},
        {"source": "B", "target": "C"},
        {"source": "C", "target": "A"}
    ]
    cycles = detect_circular_imports(edges)
    assert len(cycles) == 1
    assert set(cycles[0]) == {"A", "B", "C"}

def test_detect_circular_imports_self_loop():
    edges = [
        {"source": "A", "target": "A"}
    ]
    cycles = detect_circular_imports(edges)
    assert len(cycles) == 1
    assert set(cycles[0]) == {"A"}

def test_calculate_node_weights():
    nodes = [
        {"id": "A"}, {"id": "B"}, {"id": "C"}, {"id": "D"}
    ]
    edges = [
        {"source": "A", "target": "B"},
        {"source": "B", "target": "C"},
        {"source": "A", "target": "D"}
    ]
    # Descendants of A: B, C, D (3)
    # Descendants of B: C (1)
    # Descendants of C: 0
    # Descendants of D: 0
    weights = calculate_node_weights(nodes, edges)
    assert weights["A"] == 3
    assert weights["B"] == 1
    assert weights["C"] == 0
    assert weights["D"] == 0

def test_calculate_node_weights_with_cycle():
    nodes = [
        {"id": "A"}, {"id": "B"}, {"id": "C"}
    ]
    edges = [
        {"source": "A", "target": "B"},
        {"source": "B", "target": "C"},
        {"source": "C", "target": "A"}
    ]
    weights = calculate_node_weights(nodes, edges)
    # Each node can reach all other 2 nodes, plus itself due to the cycle (total 3)
    assert weights["A"] == 3
    assert weights["B"] == 3
    assert weights["C"] == 3
