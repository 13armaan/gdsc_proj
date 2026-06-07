# pyrefly: ignore [missing-import]
import pytest
from app.services.parsers.factory import ParserFactory
from app.services.parsers.python_parser import PythonParser
from app.services.parsers.js_parser import JSParser

def test_parser_factory():
    assert isinstance(ParserFactory.get_parser('.py'), PythonParser)
    assert isinstance(ParserFactory.get_parser('.js'), JSParser)
    assert isinstance(ParserFactory.get_parser('.tsx'), JSParser)
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
    assert set(deps) == {"os", "sys", "math", "pathlib", "sqlmodel"}

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
    assert set(deps) == {"react", "react-router-dom", "normalize.css", "lodash", "axios"}
