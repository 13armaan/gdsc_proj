from abc import ABC, abstractmethod
from typing import List

class BaseParser(ABC):
    @abstractmethod
    def extract_dependencies(self, file_path: str, content: str) -> List[dict]:
        """
        Extract imported modules or dependencies from the given file content.
        """
        pass
