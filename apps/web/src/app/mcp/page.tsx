"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Terminal, Laptop, Code2, Bot, Play } from "lucide-react";
import McpConnectModal from "../../components/McpConnectModal";

export default function McpPage() {
  const [modalOpen, setModalOpen] = useState(true);

  return (
    <div className="w-full text-slate-100 flex flex-col">
      <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Command Dashboard
          </Link>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow transition"
          >
            <Sparkles className="w-4 h-4" />
            Open MCP Connect Hub
          </button>
        </div>

        <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Argus Model Context Protocol (MCP) Hub
          </h1>
          <p className="max-w-2xl mx-auto text-sm text-slate-400 leading-relaxed">
            Connect Claude Desktop, Cursor, Cline, Windsurf, or paste our sovereign AI Agent prompt directly
            into ChatGPT or Gemini to unlock 42 air-gapped deterministic acquisition underwriting and sourcing tools.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition shadow-lg shadow-emerald-900/30"
            >
              Launch MCP Connect Hub
            </button>
          </div>
        </div>

        <McpConnectModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    );
  }
