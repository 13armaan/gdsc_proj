import os
# pyrefly: ignore [missing-import]
import pytest
import tempfile
from app.services.metrics_analyzer import calculate_file_metrics, aggregate_statistics

def test_calculate_file_metrics():
    with tempfile.TemporaryDirectory() as tmpdir:
        file1 = os.path.join(tmpdir, "test1.py")
        file2 = os.path.join(tmpdir, "test2.ts")
        file3 = os.path.join(tmpdir, "test3.txt") # Unknown lang
        
        with open(file1, 'w', encoding='utf-8') as f:
            f.write("if True:\n    print('hello')\nelse:\n    pass\n") # 2 complexity, 4 loc
            
        with open(file2, 'w', encoding='utf-8') as f:
            f.write("for (let i = 0; i < 10; i++) { while(true) {} }\nswitch(x) { case 1: break; }\n") # for, while, switch, case -> 4 complexity, 2 loc
            
        with open(file3, 'w', encoding='utf-8') as f:
            f.write("Just some text.\nNo keywords here.\n") # 0 complexity, 2 loc
            
        files = [file1, file2, file3, os.path.join(tmpdir, "does_not_exist.py")]
        
        metrics = calculate_file_metrics(files)
        
        assert len(metrics) == 3
        
        # Test 1
        m1 = next(m for m in metrics if m["file_path"] == file1)
        assert m1["language"] == "Python"
        assert m1["complexity_score"] == 2
        assert m1["loc"] == 4
        assert m1["size_bytes"] > 0
        
        # Test 2
        m2 = next(m for m in metrics if m["file_path"] == file2)
        assert m2["language"] == "TypeScript"
        assert m2["complexity_score"] == 4
        assert m2["loc"] == 2
        
        # Test 3
        m3 = next(m for m in metrics if m["file_path"] == file3)
        assert m3["language"] == "Unknown"
        assert m3["complexity_score"] == 0

def test_aggregate_statistics():
    file_metrics = [
        {"file_path": "f1.py", "size_bytes": 100, "language": "Python", "complexity_score": 10, "loc": 50},
        {"file_path": "f2.py", "size_bytes": 200, "language": "Python", "complexity_score": 5, "loc": 100},
        {"file_path": "f3.ts", "size_bytes": 300, "language": "TypeScript", "complexity_score": 20, "loc": 150},
        {"file_path": "f4.ts", "size_bytes": 50, "language": "TypeScript", "complexity_score": 1, "loc": 25},
    ]
    
    stats = aggregate_statistics(file_metrics)
    
    assert stats["language_distribution"] == {
        "Python": 300,
        "TypeScript": 350
    }
    
    assert stats["average_file_size"] == 650 / 4
    
    assert len(stats["top_10_largest_files"]) == 4
    assert stats["top_10_largest_files"][0]["file_path"] == "f3.ts" # 300
    assert stats["top_10_largest_files"][1]["file_path"] == "f2.py" # 200
    
    assert len(stats["top_10_most_complex_files"]) == 4
    assert stats["top_10_most_complex_files"][0]["file_path"] == "f3.ts" # 20
    assert stats["top_10_most_complex_files"][1]["file_path"] == "f1.py" # 10
