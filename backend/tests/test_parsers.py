# pyrefly: ignore [missing-import]
import pytest
from app.services.parsers.factory import ParserFactory
from app.services.parsers.python_parser import PythonParser
from app.services.parsers.js_parser import JSParser
from app.services.parsers.cpp_parser import CppParser
from app.services.parsers.go_parser import GoParser
from app.services.parsers.java_parser import JavaParser
from app.services.parsers.ruby_parser import RubyParser

def test_parser_factory():
    assert isinstance(ParserFactory.get_parser('.py'), PythonParser)
    assert isinstance(ParserFactory.get_parser('.js'), JSParser)
    assert isinstance(ParserFactory.get_parser('.tsx'), JSParser)
    assert isinstance(ParserFactory.get_parser('.cpp'), CppParser)
    assert isinstance(ParserFactory.get_parser('.go'), GoParser)
    assert isinstance(ParserFactory.get_parser('.java'), JavaParser)
    assert isinstance(ParserFactory.get_parser('.rb'), RubyParser)
    assert ParserFactory.get_parser('.txt') is None

def test_python_parser():
    parser = PythonParser()
    content = """
import os
import sys, math
from pathlib import Path
from sqlmodel import Field, SQLModel

def my_func():
    pass
"""
    deps = parser.extract_dependencies("test.py", content)
    targets = {d["target"] for d in deps}
    assert targets == {"sqlmodel"}
    assert any(d["statement"] == "from sqlmodel import Field, SQLModel" for d in deps if d["target"] == "sqlmodel")

def test_python_parser_syntax_error(caplog):
    parser = PythonParser()
    content = """
import os
def my_func(
"""
    deps = parser.extract_dependencies("test.py", content)
    assert deps == []
    assert "SyntaxError parsing Python file" in caplog.text

def test_js_parser():
    parser = JSParser()
    content = """
import React, { useState } from 'react';
import { BrowserRouter } from "react-router-dom";
import 'normalize.css';
const lodash = require('lodash');
const axios = require("axios");
"""
    deps = parser.extract_dependencies("test.js", content)
    targets = {d["target"] for d in deps}
    assert targets == {"react", "react-router-dom", "normalize.css", "lodash", "axios"}
    assert any(d["statement"] == "import React, { useState } from 'react'" for d in deps if d["target"] == "react")

def test_cpp_parser():
    parser = CppParser()
    content = """
#include <iostream>
#include <vector>
#include "my_local_header.h"
#include 'another_local.hpp'
"""
    deps = parser.extract_dependencies("test.cpp", content)
    targets = {d["target"] for d in deps}
    assert targets == {"my_local_header.h", "another_local.hpp"}
    assert any(d["statement"] == '#include "my_local_header.h"' for d in deps if d["target"] == "my_local_header.h")

def test_go_parser():
    parser = GoParser()
    content = """
import "fmt"
import alias "github.com/alias/pkg"
import (
    "errors"
    "path/to/localpkg"
    myalias "another/local/pkg"
)
"""
    deps = parser.extract_dependencies("test.go", content)
    targets = {d["target"] for d in deps}
    assert targets == {"github.com/alias/pkg", "path/to/localpkg", "another/local/pkg"}
    assert any(d["statement"] == 'import alias "github.com/alias/pkg"' for d in deps if d["target"] == "github.com/alias/pkg")

def test_java_parser():
    parser = JavaParser()
    content = """
import java.util.List;
import com.example.myproject.MyClass;
"""
    deps = parser.extract_dependencies("test.java", content)
    targets = {d["target"] for d in deps}
    assert targets == {"com.example.myproject.MyClass"}
    assert any(d["statement"] == "import com.example.myproject.MyClass;" for d in deps if d["target"] == "com.example.myproject.MyClass")

def test_ruby_parser():
    parser = RubyParser()
    content = """
require 'json'
require_relative "my_module"
load 'my_script.rb'
"""
    deps = parser.extract_dependencies("test.rb", content)
    targets = {d["target"] for d in deps}
    assert targets == {"my_module", "my_script.rb"}
    assert any(d["statement"] == 'require_relative "my_module"' for d in deps if d["target"] == "my_module")
