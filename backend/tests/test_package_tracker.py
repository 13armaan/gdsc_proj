import json
from app.services.package_tracker import parse_manifests, analyze_package_usage

def test_parse_manifests(tmp_path):
    # Mock package.json
    pkg_json = tmp_path / "package.json"
    pkg_json.write_text(json.dumps({
        "dependencies": {
            "react": "^18.2.0",
            "lodash": "4.17.21"
        },
        "devDependencies": {
            "jest": "29.0.0"
        }
    }), encoding="utf-8")
    
    # Mock requirements.txt
    req_txt = tmp_path / "requirements.txt"
    req_txt.write_text(
        "django==4.2\n"
        "fastapi>=0.100.0\n"
        "pytest\n"
        "# this is a comment\n"
        "requests~=2.31.0\n",
        encoding="utf-8"
    )
    
    packages = parse_manifests(str(tmp_path))
    expected = {"react", "lodash", "jest", "django", "fastapi", "pytest", "requests"}
    
    assert set(packages) == expected

def test_analyze_package_usage():
    declared = ["react", "lodash", "jest", "django", "fastapi", "pytest"]
    imports = [
        "react",
        "react-dom",        # Not declared directly
        "lodash/map",       # Submodule of lodash
        "django.db.models", # Submodule of django
        "fastapi",
        "fastapi.responses",# Submodule of fastapi
        "os",               # Standard library, ignored
        "sys"               # Standard library, ignored
    ]
    
    result = analyze_package_usage(declared, imports)
    
    stats = result["usage_stats"]
    unused = result["unused_dependencies"]
    
    assert stats["react"] == 1
    assert stats["lodash"] == 1
    assert stats["django"] == 1
    assert stats["fastapi"] == 2
    assert stats["jest"] == 0
    assert stats["pytest"] == 0
    
    assert "jest" in unused
    assert "pytest" in unused
    assert len(unused) == 2

    # Ensure sorting works
    counts = list(stats.values())
    assert counts == sorted(counts, reverse=True)
