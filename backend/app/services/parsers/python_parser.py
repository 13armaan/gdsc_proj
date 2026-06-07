import ast
import logging
from typing import List
from .base import BaseParser

logger = logging.getLogger(__name__)

class PythonParser(BaseParser):
    def extract_dependencies(self, file_path: str, content: str) -> List[str]:
        dependencies = []
        try:
            tree = ast.parse(content, filename=file_path)
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        dependencies.append(alias.name)
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        dependencies.append(node.module)
        except SyntaxError as e:
            logger.warning(f"SyntaxError parsing Python file {file_path}: {e}")
        except Exception as e:
            logger.warning(f"Error parsing Python file {file_path}: {e}")
            
        # Return unique dependencies
        return list(set(dependencies))
