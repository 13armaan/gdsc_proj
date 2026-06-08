import ast
import logging
import sys
from typing import List
from .base import BaseParser

logger = logging.getLogger(__name__)

class PythonParser(BaseParser):
    def extract_dependencies(self, file_path: str, content: str) -> List[dict]:
        dependencies = []
        lines = content.splitlines()
        try:
            tree = ast.parse(content, filename=file_path)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        base_module = alias.name.split('.')[0]
                        if base_module not in sys.stdlib_module_names:
                            statement = lines[node.lineno - 1].strip() if hasattr(node, 'lineno') and 0 < node.lineno <= len(lines) else "import"
                            dependencies.append({"target": alias.name, "statement": statement})
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        base_module = node.module.split('.')[0]
                        if base_module not in sys.stdlib_module_names:
                            statement = lines[node.lineno - 1].strip() if hasattr(node, 'lineno') and 0 < node.lineno <= len(lines) else "import"
                            dependencies.append({"target": node.module, "statement": statement})
        except SyntaxError as e:
            logger.warning(f"SyntaxError parsing Python file {file_path}: {e}")
        except Exception as e:
            logger.warning(f"Error parsing Python file {file_path}: {e}")
            
        # Return unique dependencies by target
        unique_deps = {}
        for d in dependencies:
            if d["target"] not in unique_deps:
                unique_deps[d["target"]] = d
        return list(unique_deps.values())
