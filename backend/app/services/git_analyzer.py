import subprocess
from collections import defaultdict
from typing import Dict, Any

def get_git_metadata(target_path: str) -> Dict[str, Any]:
    result = {
        "contribution_heatmap": {},
        "growth_history": {}
    }
    
    try:
        # Check if it's a git repo
        subprocess.run(
            ["git", "status"], 
            cwd=target_path, 
            capture_output=True, 
            text=True, 
            check=True
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return result

    # 1. Contribution Heatmap
    try:
        log_output = subprocess.run(
            ["git", "log", "--format=%aI|%aN"],
            cwd=target_path,
            capture_output=True,
            text=True,
            check=True
        ).stdout

        heatmap = defaultdict(lambda: defaultdict(int))
        for line in log_output.strip().split('\n'):
            if not line:
                continue
            parts = line.split('|', 1)
            if len(parts) == 2:
                iso_date_str, author = parts
                # Extract YYYY-MM-DD
                # ISO date format: 2026-06-08T18:32:26+05:30
                if len(iso_date_str) >= 10:
                    date_str = iso_date_str[:10]
                    heatmap[date_str][author] += 1
        
        # Convert defaultdicts to dicts
        result["contribution_heatmap"] = {k: dict(v) for k, v in heatmap.items()}
    except subprocess.CalledProcessError:
        pass

    # 2. Folder Growth Analysis
    try:
        growth_output = subprocess.run(
            ["git", "log", "--numstat", "--format=%aI"],
            cwd=target_path,
            capture_output=True,
            text=True,
            check=True
        ).stdout

        growth = defaultdict(lambda: {"added": 0, "removed": 0, "net": 0})
        
        current_month = None
        for line in growth_output.strip().split('\n'):
            line = line.strip()
            if not line:
                continue
                
            # If line matches ISO date roughly (contains T and has length >= 10)
            if "T" in line and len(line) >= 10 and line[4] == '-':
                current_month = line[:7] # YYYY-MM
            elif current_month:
                parts = line.split('\t')
                if len(parts) >= 2:
                    added_str, removed_str = parts[0], parts[1]
                    if added_str != '-' and removed_str != '-':
                        try:
                            added = int(added_str)
                            removed = int(removed_str)
                            growth[current_month]["added"] += added
                            growth[current_month]["removed"] += removed
                            growth[current_month]["net"] += (added - removed)
                        except ValueError:
                            pass

        result["growth_history"] = dict(growth)
    except subprocess.CalledProcessError:
        pass

    return result
