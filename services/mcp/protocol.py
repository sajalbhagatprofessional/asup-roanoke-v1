"""
Model Context Protocol (MCP) Standard Protocol Definitions (2024-11-05 Specification).
Anthropic Universal Open Standard for AI Agent Tool Calling, Resource Retrieval, and Prompts.
Implements JSON-RPC 2.0 request/response structures.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Union


class McpErrorCode(int, Enum):
    PARSE_ERROR = -32700
    INVALID_REQUEST = -32600
    METHOD_NOT_FOUND = -32601
    INVALID_PARAMS = -32602
    INTERNAL_ERROR = -32603


@dataclass
class McpTool:
    name: str
    description: str
    inputSchema: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "inputSchema": self.inputSchema,
        }


@dataclass
class McpResource:
    uri: str
    name: str
    description: Optional[str] = None
    mimeType: Optional[str] = "application/json"

    def to_dict(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {
            "uri": self.uri,
            "name": self.name,
            "mimeType": self.mimeType,
        }
        if self.description:
            d["description"] = self.description
        return d


@dataclass
class McpPromptArgument:
    name: str
    description: Optional[str] = None
    required: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "required": self.required,
        }


@dataclass
class McpPrompt:
    name: str
    description: Optional[str] = None
    arguments: List[McpPromptArgument] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "arguments": [a.to_dict() for a in self.arguments],
        }


@dataclass
class JsonRpcRequest:
    jsonrpc: str
    id: Optional[Union[str, int]]
    method: str
    params: Optional[Dict[str, Any]] = None


@dataclass
class JsonRpcResponse:
    jsonrpc: str = "2.0"
    id: Optional[Union[str, int]] = None
    result: Optional[Any] = None
    error: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {"jsonrpc": self.jsonrpc, "id": self.id}
        if self.error is not None:
            d["error"] = self.error
        else:
            d["result"] = self.result
        return d
