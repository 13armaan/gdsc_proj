import re
from typing import List
from .base import BaseParser

class CppParser(BaseParser):
    def extract_dependencies(self, file_path: str, content: str) -> List[str]:
        # Match local includes with quotes, ignoring angle brackets
        pattern = re.compile(r'#include\s+["\']([^"\']+)["\']')
        return list(set(pattern.findall(content)))
