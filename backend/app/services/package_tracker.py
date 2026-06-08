import os
import json
import re
from typing import List, Dict, Any

def parse_manifests(target_path: str) -> List[str]:
    """
    Scans the target path for package.json and requirements.txt files
    and extracts declared external dependencies.
    """
    packages = set()
    
    for root, _, files in os.walk(target_path):
        if 'package.json' in files:
            try:
                with open(os.path.join(root, 'package.json'), 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if 'dependencies' in data:
                        packages.update(data['dependencies'].keys())
                    if 'devDependencies' in data:
                        packages.update(data['devDependencies'].keys())
            except Exception:
                pass
                
        if 'requirements.txt' in files:
            try:
                with open(os.path.join(root, 'requirements.txt'), 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith('#'):
                            continue
                        # Split by version specifiers to extract just the package name
                        pkg_name = re.split(r'[=><~]+', line)[0].strip()
                        if pkg_name:
                            packages.add(pkg_name)
            except Exception:
                pass
                
    return list(packages)

def analyze_package_usage(declared_packages: List[str], all_extracted_imports: List[str]) -> Dict[str, Any]:
    """
    Analyzes the frequency of declared packages within the extracted imports
    and identifies unused dependencies.
    """
    usage_stats = {}
    
    # Initialize counts
    for pkg in declared_packages:
        usage_stats[pkg] = 0
        
    for imp in all_extracted_imports:
        for pkg in declared_packages:
            # Match exactly or match sub-modules (e.g., react/dom, django.db)
            if imp == pkg or imp.startswith(f"{pkg}/") or imp.startswith(f"{pkg}."):
                usage_stats[pkg] += 1
                
    # Sort usage stats by count descending
    sorted_usage = dict(sorted(usage_stats.items(), key=lambda item: item[1], reverse=True))
    
    unused = [pkg for pkg, count in sorted_usage.items() if count == 0]
    
    return {
        "usage_stats": sorted_usage,
        "unused_dependencies": unused
    }
