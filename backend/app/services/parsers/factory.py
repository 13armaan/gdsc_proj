from typing import Optional
from .base import BaseParser
from .python_parser import PythonParser
from .js_parser import JSParser

class ParserFactory:
    @staticmethod
    def get_parser(extension: str) -> Optional[BaseParser]:
        extension = extension.lower()
        if extension == '.py':
            return PythonParser()
        elif extension in ['.js', '.ts', '.jsx', '.tsx']:
            return JSParser()
        return None
