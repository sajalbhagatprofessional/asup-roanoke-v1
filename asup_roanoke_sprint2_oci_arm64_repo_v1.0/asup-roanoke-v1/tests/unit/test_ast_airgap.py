import ast
import os
import pathlib

FORBIDDEN_IMPORTS = {
    "httpx",
    "requests",
    "urllib",
    "aiohttp",
    "openai",
    "anthropic",
    "google",
    "vertexai",
    "langchain",
    "langgraph",
    "autogen",
}


def test_underwriting_engine_ast_zero_floats_and_zero_network_or_llm_imports():
    """
    Gate QA-02: Parses the Python AST of every file in packages/underwriting_engine/
    and asserts:
    1. Zero `float` literals or `float(...)` calls.
    2. Zero network or LLM library imports.
    """
    engine_dir = pathlib.Path(__file__).resolve().parents[2] / "packages" / "underwriting_engine"
    py_files = list(engine_dir.glob("*.py"))
    assert len(py_files) >= 4

    for py_file in py_files:
        source = py_file.read_text(encoding="utf-8")
        tree = ast.parse(source, filename=str(py_file))
        for node in ast.walk(tree):
            if isinstance(node, ast.Constant) and isinstance(node.value, float):
                raise AssertionError(f"Forbidden float literal {node.value} in {py_file.name}:{node.lineno}")
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "float":
                raise AssertionError(f"Forbidden float() call in {py_file.name}:{node.lineno}")
            if isinstance(node, ast.Import):
                for alias in node.names:
                    root_mod = alias.name.split(".")[0]
                    assert root_mod not in FORBIDDEN_IMPORTS, f"Forbidden import {alias.name} in {py_file.name}"
            if isinstance(node, ast.ImportFrom) and node.module:
                root_mod = node.module.split(".")[0]
                assert root_mod not in FORBIDDEN_IMPORTS, f"Forbidden from-import {node.module} in {py_file.name}"
