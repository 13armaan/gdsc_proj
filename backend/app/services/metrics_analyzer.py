import os
import re
from typing import List, Dict, Any

COMPLEXITY_REGEX = re.compile(r"\b(if|else|for|while|switch|case|catch)\b")

LANGUAGE_MAP = {
    ".py": "Python",
    ".ts": "TypeScript",
    ".tsx": "TypeScript React",
    ".js": "JavaScript",
    ".jsx": "JavaScript React",
    ".java": "Java",
    ".c": "C",
    ".cpp": "C++",
    ".h": "C/C++ Header",
    ".cs": "C#",
    ".go": "Go",
    ".rs": "Rust",
    ".rb": "Ruby",
    ".php": "PHP",
    ".html": "HTML",
    ".css": "CSS",
    ".md": "Markdown",
    ".json": "JSON",
    ".yml": "YAML",
    ".yaml": "YAML",
    ".xml": "XML",
    ".sql": "SQL",
    ".sh": "Shell",
}

def get_language(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    return LANGUAGE_MAP.get(ext, "Unknown")

def calculate_file_metrics(files: List[str]) -> List[Dict[str, Any]]:
    metrics = []
    for file_path in files:
        if not os.path.exists(file_path):
            continue
            
        try:
            size_bytes = os.path.getsize(file_path)
        except OSError:
            size_bytes = 0

        language = get_language(file_path)
        
        complexity_score = 0
        loc = 0
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                complexity_score = len(COMPLEXITY_REGEX.findall(content))
                loc = len(content.splitlines())
        except Exception:
            pass

        metrics.append({
            "file_path": file_path,
            "size_bytes": size_bytes,
            "language": language,
            "complexity_score": complexity_score,
            "loc": loc
        })
        
    return metrics

def aggregate_statistics(file_metrics: List[Dict[str, Any]]) -> Dict[str, Any]:
    language_dist = {}
    total_bytes = 0
    
    for fm in file_metrics:
        lang = fm["language"]
        size = fm["size_bytes"]
        language_dist[lang] = language_dist.get(lang, 0) + size
        total_bytes += size
        
    top_10_largest = sorted(file_metrics, key=lambda x: x["size_bytes"], reverse=True)[:10]
    top_10_complex = sorted(file_metrics, key=lambda x: x["complexity_score"], reverse=True)[:10]
    
    avg_file_size = total_bytes / len(file_metrics) if file_metrics else 0
    
    return {
        "language_distribution": language_dist,
        "top_10_largest_files": top_10_largest,
        "top_10_most_complex_files": top_10_complex,
        "average_file_size": avg_file_size
    }
