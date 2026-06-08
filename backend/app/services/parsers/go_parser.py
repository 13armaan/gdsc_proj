import re
from typing import List
from .base import BaseParser

class GoParser(BaseParser):
    def extract_dependencies(self, file_path: str, content: str) -> List[str]:
        deps = []
        
        # Match single-line import: import "path" or import alias "path"
        single_line_pattern = re.compile(r'import\s+(?:[a-zA-Z0-9_\.]+\s+)?["\']([^"\']+)["\']')
        deps.extend(single_line_pattern.findall(content))

        # Match multi-line import blocks
        multi_line_pattern = re.compile(r'import\s*\((.*?)\)', re.DOTALL)
        for block in multi_line_pattern.findall(content):
            # Find all quoted paths inside the block
            string_pattern = re.compile(r'["\']([^"\']+)["\']')
            deps.extend(string_pattern.findall(block))
            
        # Ignore single-word paths (e.g. "fmt", "os")
        return [d for d in list(set(deps)) if '/' in d or '.' in d]
