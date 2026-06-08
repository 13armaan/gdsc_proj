from typing import Optional
from .base import BaseParser
from .python_parser import PythonParser
from .js_parser import JSParser
from .cpp_parser import CppParser
from .go_parser import GoParser
from .java_parser import JavaParser
from .ruby_parser import RubyParser

class ParserFactory:
    @staticmethod
    def get_parser(extension: str) -> Optional[BaseParser]:
        extension = extension.lower()
        if extension == '.py':
            return PythonParser()
        elif extension in ['.js', '.ts', '.jsx', '.tsx']:
            return JSParser()
        elif extension in ['.cpp', '.h', '.hpp', '.cc']:
            return CppParser()
        elif extension == '.go':
            return GoParser()
        elif extension == '.java':
            return JavaParser()
        elif extension == '.rb':
            return RubyParser()
        return None
