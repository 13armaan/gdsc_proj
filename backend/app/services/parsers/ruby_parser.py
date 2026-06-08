import re
from typing import List
from .base import BaseParser

class RubyParser(BaseParser):
    def extract_dependencies(self, file_path: str, content: str) -> List[str]:
        deps = []
        
        # Match require and require_relative
        require_rel_pattern = re.compile(r'require_relative\s+[\'"]([^\'"]+)[\'"]')
        deps.extend(require_rel_pattern.findall(content))
        
        require_pattern = re.compile(r'require\s+[\'"]([^\'"]+)[\'"]')
        for d in require_pattern.findall(content):
            # Avoid native standard gems (usually single words)
            if '/' in d or '.' in d:
                deps.append(d)
        
        # Match load
        load_pattern = re.compile(r'load\s+[\'"]([^\'"]+)[\'"]')
        deps.extend(load_pattern.findall(content))
        
        return list(set(deps))
