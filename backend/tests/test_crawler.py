import os
# pyrefly: ignore [missing-import]
import pytest
from pathlib import Path
from app.services.crawler import crawl_directory

@pytest.mark.asyncio
async def test_crawl_directory(tmp_path: Path):
    # Create valid files
    valid_file1 = tmp_path / "file1.txt"
    valid_file1.write_text("hello")
    
    valid_dir = tmp_path / "src"
    valid_dir.mkdir()
    valid_file2 = valid_dir / "main.py"
    valid_file2.write_text("print('hello')")
    
    # Create ignored directories with files
    git_dir = tmp_path / ".git"
    git_dir.mkdir()
    (git_dir / "config").write_text("git config")
    
    node_modules_dir = tmp_path / "node_modules"
    node_modules_dir.mkdir()
    (node_modules_dir / "package.json").write_text("{}")
    
    build_dir = tmp_path / "build"
    build_dir.mkdir()
    (build_dir / "output.bin").write_text("0101")
    
    # Try to create a symlink. On Windows, this might require privileges.
    # If it fails, we catch OSError and test runs without the symlink check.
    symlink_path = tmp_path / "symlink_dir"
    try:
        os.symlink(str(valid_dir), str(symlink_path), target_is_directory=True)
        created_symlink = True
    except OSError:
        created_symlink = False
    
    # Run the crawler
    files = await crawl_directory(str(tmp_path))
    
    # Check that valid files are present
    assert str(valid_file1.absolute()) in files
    assert str(valid_file2.absolute()) in files
    
    # Check that ignored directory files are NOT present
    assert str((git_dir / "config").absolute()) not in files
    assert str((node_modules_dir / "package.json").absolute()) not in files
    assert str((build_dir / "output.bin").absolute()) not in files
    
    # Check that symlinked files are not crawled twice
    if created_symlink:
        # A symlink is skipped, so symlink_path / "main.py" should not be in the list
        symlinked_file = os.path.abspath(os.path.join(symlink_path, "main.py"))
        assert symlinked_file not in files
