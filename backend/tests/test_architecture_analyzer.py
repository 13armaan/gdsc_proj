import os
# pyrefly: ignore [missing-import]
import pytest
from app.services.architecture_analyzer import detect_modules_and_layers, calculate_coupling_metrics

def test_detect_modules_and_layers():
    # Simulate an absolute path structure
    base = os.path.abspath("/project")
    nodes = [
        {"id": os.path.join(base, "src", "components", "Button.tsx")},
        {"id": os.path.join(base, "src", "components", "Card.tsx")},
        {"id": os.path.join(base, "app", "api", "routes.py")},
        {"id": os.path.join(base, "app", "models", "schema.py")},
        {"id": os.path.join(base, "main.py")},
    ]
    
    layers = detect_modules_and_layers(nodes)
    
    assert "src/components" in layers
    assert "app/api" in layers
    assert "app/models" in layers
    assert "root" in layers
    
    assert len(layers["src/components"]) == 2
    assert len(layers["app/api"]) == 1
    assert len(layers["root"]) == 1

def test_calculate_coupling_metrics_standard():
    base = os.path.abspath("/project")
    nodes = [
        {"id": os.path.join(base, "api", "routes.py")},        # api layer
        {"id": os.path.join(base, "services", "logic.py")},    # services layer
        {"id": os.path.join(base, "database", "models.py")},   # database layer
    ]
    
    edges = [
        # api depends on services
        {"source": os.path.join(base, "api", "routes.py"), "target": os.path.join(base, "services", "logic.py")},
        # services depends on database
        {"source": os.path.join(base, "services", "logic.py"), "target": os.path.join(base, "database", "models.py")},
    ]
    
    result = calculate_coupling_metrics(nodes, edges)
    modules = result["modules"]
    
    # API: depends on services (Ce=1), nobody depends on it (Ca=0). I = 1 / (0+1) = 1.0 (unstable)
    assert modules["api"]["Ce"] == 1
    assert modules["api"]["Ca"] == 0
    assert modules["api"]["I"] == 1.0
    
    # Database: depends on nobody (Ce=0), services depend on it (Ca=1). I = 0 / (1+0) = 0.0 (stable)
    assert modules["database"]["Ce"] == 0
    assert modules["database"]["Ca"] == 1
    assert modules["database"]["I"] == 0.0
    
    # Services: depends on db (Ce=1), api depends on it (Ca=1). I = 1 / (1+1) = 0.5
    assert modules["services"]["Ce"] == 1
    assert modules["services"]["Ca"] == 1
    assert modules["services"]["I"] == 0.5

def test_calculate_coupling_metrics_tight_coupling():
    base = os.path.abspath("/project")
    nodes = [
        {"id": os.path.join(base, "module_a", "file1.py")},
        {"id": os.path.join(base, "module_b", "file2.py")},
    ]
    edges = [
        {"source": os.path.join(base, "module_a", "file1.py"), "target": os.path.join(base, "module_b", "file2.py")},
        {"source": os.path.join(base, "module_b", "file2.py"), "target": os.path.join(base, "module_a", "file1.py")},
    ]
    
    result = calculate_coupling_metrics(nodes, edges)
    
    tight_pairs = result["tightly_coupled_pairs"]
    assert len(tight_pairs) == 1
    assert set(tight_pairs[0]) == {"module_a", "module_b"}
    
    # I = 1 / (1 + 1) = 0.5 for both
    assert result["modules"]["module_a"]["I"] == 0.5
    assert result["modules"]["module_b"]["I"] == 0.5
