import re
from typing import List
from .base import BaseParser

class GoParser(BaseParser):
    def extract_dependencies(self, file_path: str, content: str) -> List[dict]:
        dependencies = []
        
        # Match single-line import: import "path" or import alias "path"
        single_line_pattern = re.compile(r'import\s+(?:[a-zA-Z0-9_\.]+\s+)?["\']([^"\']+)["\']')
        for match in single_line_pattern.finditer(content):
            target = match.group(1)
            if '/' in target or '.' in target:
                dependencies.append({"target": target, "statement": match.group(0).strip()})

        # Match multi-line import blocks
        multi_line_pattern = re.compile(r'import\s*\((.*?)\)', re.DOTALL)
        for block_match in multi_line_pattern.finditer(content):
            block = block_match.group(1)
            string_pattern = re.compile(r'["\']([^"\']+)["\']')
            for line in block.split('\n'):
                line_match = string_pattern.search(line)
                if line_match:
                    target = line_match.group(1)
                    if '/' in target or '.' in target:
                        dependencies.append({"target": target, "statement": line.strip()})
            
        unique_deps = {}
        for d in dependencies:
            if d["target"] not in unique_deps:
                unique_deps[d["target"]] = d
        return list(unique_deps.values())
