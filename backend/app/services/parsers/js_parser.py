import re
import logging
from typing import List
from .base import BaseParser

logger = logging.getLogger(__name__)

class JSParser(BaseParser):
    def extract_dependencies(self, file_path: str, content: str) -> List[str]:
        dependencies = []
        try:
            # Matches: import ... from 'module' or "module"
            es6_from_pattern = r'import\s+.*?from\s+[\'"]([^\'"]+)[\'"]'
            
            # Matches: import 'module' or "module"
            es6_direct_pattern = r'import\s+[\'"]([^\'"]+)[\'"]'
            
            # Matches: require('module') or require("module")
            commonjs_pattern = r'require\s*\(\s*[\'"]([^\'"]+)[\'"]\s*\)'
            
            for pattern in [es6_from_pattern, es6_direct_pattern, commonjs_pattern]:
                matches = re.findall(pattern, content)
                dependencies.extend(matches)
                
        except Exception as e:
            logger.warning(f"Error parsing JS file {file_path}: {e}")
            
        # Return unique dependencies
        return list(set(dependencies))
