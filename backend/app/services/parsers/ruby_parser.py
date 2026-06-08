import re
from typing import List
from .base import BaseParser

class RubyParser(BaseParser):
    def extract_dependencies(self, file_path: str, content: str) -> List[dict]:
        dependencies = []
        
        # Match require and require_relative
        require_rel_pattern = re.compile(r'require_relative\s+[\'"]([^\'"]+)[\'"]')
        for match in require_rel_pattern.finditer(content):
            dependencies.append({"target": match.group(1), "statement": match.group(0).strip()})
        
        require_pattern = re.compile(r'require\s+[\'"]([^\'"]+)[\'"]')
        for match in require_pattern.finditer(content):
            target = match.group(1)
            if '/' in target or '.' in target:
                dependencies.append({"target": target, "statement": match.group(0).strip()})
        
        # Match load
        load_pattern = re.compile(r'load\s+[\'"]([^\'"]+)[\'"]')
        for match in load_pattern.finditer(content):
            dependencies.append({"target": match.group(1), "statement": match.group(0).strip()})
            
        unique_deps = {}
        for d in dependencies:
            if d["target"] not in unique_deps:
                unique_deps[d["target"]] = d
        return list(unique_deps.values())
