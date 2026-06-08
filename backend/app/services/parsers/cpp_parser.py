import re
from typing import List
from .base import BaseParser

class CppParser(BaseParser):
    def extract_dependencies(self, file_path: str, content: str) -> List[dict]:
        dependencies = []
        # Match local includes with quotes, ignoring angle brackets
        pattern = re.compile(r'#include\s+["\']([^"\']+)["\']')
        for match in pattern.finditer(content):
            dependencies.append({"target": match.group(1), "statement": match.group(0).strip()})
            
        unique_deps = {}
        for d in dependencies:
            if d["target"] not in unique_deps:
                unique_deps[d["target"]] = d
        return list(unique_deps.values())
