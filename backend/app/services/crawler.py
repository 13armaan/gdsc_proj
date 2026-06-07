import os
import asyncio

IGNORED_DIRS = {".git", "node_modules", "venv", ".venv", "__pycache__", "build", "dist"}

async def crawl_directory(target_path: str) -> list[str]:
    """
    Recursively process and return all valid file paths inside target_path.
    Ignores specific standard binary/build folders and skips OS-level symlinks.
    """
    return await asyncio.to_thread(_crawl_sync, target_path)

def _crawl_sync(target_path: str) -> list[str]:
    valid_files = []
    
    # Check if the target_path itself is valid
    if not os.path.exists(target_path):
        return valid_files
        
    stack = [os.path.abspath(target_path)]
    
    while stack:
        current_dir = stack.pop()
        
        try:
            with os.scandir(current_dir) as it:
                for entry in it:
                    if entry.is_symlink():
                        # Explicitly skip symlinks to prevent infinite loops
                        continue
                        
                    if entry.is_dir():
                        if entry.name not in IGNORED_DIRS:
                            stack.append(entry.path)
                    elif entry.is_file():
                        valid_files.append(os.path.abspath(entry.path))
        except (PermissionError, OSError):
            # Skip directories we don't have permission to read
            continue
            
    return valid_files
