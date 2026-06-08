import re
from typing import List
from .base import BaseParser

class JavaParser(BaseParser):
    def extract_dependencies(self, file_path: str, content: str) -> List[str]:
        pattern = re.compile(r'import\s+([\w\.]+);')
        deps = list(set(pattern.findall(content)))
        return [d for d in deps if not (d.startswith('java.') or d.startswith('javax.'))]
