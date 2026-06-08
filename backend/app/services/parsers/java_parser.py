import re
from typing import List
from .base import BaseParser

class JavaParser(BaseParser):
    def extract_dependencies(self, file_path: str, content: str) -> List[dict]:
        dependencies = []
        pattern = re.compile(r'import\s+([\w\.]+);')
        for match in pattern.finditer(content):
            target = match.group(1)
            if not (target.startswith('java.') or target.startswith('javax.')):
                dependencies.append({"target": target, "statement": match.group(0).strip()})
                
        unique_deps = {}
        for d in dependencies:
            if d["target"] not in unique_deps:
                unique_deps[d["target"]] = d
        return list(unique_deps.values())
