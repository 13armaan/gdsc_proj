import subprocess
import pytest
from unittest.mock import patch, MagicMock
from app.services.git_analyzer import get_git_metadata

def test_not_a_git_repo():
    with patch("subprocess.run") as mock_run:
        mock_run.side_effect = subprocess.CalledProcessError(128, "git status")
        result = get_git_metadata("/fake/path")
        assert result == {"contribution_heatmap": {}, "growth_history": {}}

def test_get_git_metadata_success():
    # We need to mock subprocess.run based on the command args.
    def mock_subprocess_run(args, **kwargs):
        mock = MagicMock()
        if args == ["git", "status"]:
            mock.returncode = 0
            return mock
        elif args == ["git", "log", "--format=%aI|%aN"]:
            mock.stdout = "2026-06-08T18:32:26+05:30|Alice\n2026-06-08T14:00:00+05:30|Alice\n2026-06-08T12:00:00+05:30|Bob\n2026-06-07T10:00:00+05:30|Bob\n"
            return mock
        elif args == ["git", "log", "--numstat", "--format=%aI"]:
            mock.stdout = """2026-06-08T18:32:26+05:30
10\t5\tfile1.py
20\t0\tfile2.py

2026-05-10T10:00:00+00:00
0\t10\tfile1.py
"""
            return mock
        raise ValueError(f"Unexpected command: {args}")

    with patch("subprocess.run", side_effect=mock_subprocess_run):
        result = get_git_metadata("/fake/path")
        
        heatmap = result["contribution_heatmap"]
        assert heatmap["2026-06-08"]["Alice"] == 2
        assert heatmap["2026-06-08"]["Bob"] == 1
        assert heatmap["2026-06-07"]["Bob"] == 1
        
        growth = result["growth_history"]
        assert growth["2026-06"]["added"] == 30
        assert growth["2026-06"]["removed"] == 5
        assert growth["2026-06"]["net"] == 25
        
        assert growth["2026-05"]["added"] == 0
        assert growth["2026-05"]["removed"] == 10
        assert growth["2026-05"]["net"] == -10

def test_handling_binary_files():
    def mock_subprocess_run(args, **kwargs):
        mock = MagicMock()
        if args == ["git", "status"]:
            mock.returncode = 0
            return mock
        elif args == ["git", "log", "--format=%aI|%aN"]:
            mock.stdout = "2026-06-08T18:32:26+05:30|Alice\n"
            return mock
        elif args == ["git", "log", "--numstat", "--format=%aI"]:
            mock.stdout = """2026-06-08T18:32:26+05:30
10\t5\tfile1.py
-\t-\timage.png
"""
            return mock
        raise ValueError(f"Unexpected command: {args}")

    with patch("subprocess.run", side_effect=mock_subprocess_run):
        result = get_git_metadata("/fake/path")
        growth = result["growth_history"]
        assert growth["2026-06"]["added"] == 10
        assert growth["2026-06"]["removed"] == 5
        assert growth["2026-06"]["net"] == 5
