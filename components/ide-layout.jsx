"use client"

import { useState } from "react"
import { Menu, X, Play, Save, Settings, Search } from "lucide-react"
import { FileExplorer } from "./file-explorer"
import { CodeEditor } from "./code-editor"
import { Terminal } from "./terminal"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"

export function IDELayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [terminalOpen, setTerminalOpen] = useState(true)
  const [activeFile, setActiveFile] = useState("")

  return (
    <div className="h-screen bg-gray-900 text-gray-400 flex flex-col">
      {/* Top Menu Bar */}
      <div className="bg-[#171717] border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-accent rounded transition-colors lg:hidden"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="font-bold text-lg">VS Code IDE</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Save className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Play className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={cn(
            "transition-all duration-300 border-r border-border",
            sidebarOpen ? "w-64" : "w-0",
            "lg:relative absolute lg:translate-x-0 z-10 h-full",
            !sidebarOpen && "lg:w-0",
          )}
        >
          <FileExplorer onFileSelect={setActiveFile} />
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          <div className={cn("flex-1", terminalOpen ? "h-2/3" : "h-full")}>
            <CodeEditor activeFile={activeFile} />
          </div>

          {/* Terminal */}
          {terminalOpen && (
            <div className="h-1/3 border-t border-border">
              <Terminal />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-[#457EFF] text-primary-foreground px-4 py-1 text-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span>Code</span>
          <span>UTF-8</span>
          <span>LF</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTerminalOpen(!terminalOpen)}
            className="hover:bg-primary/80 px-2 py-1 rounded transition-colors"
          >
            Terminal
          </button>
          <span>Ln 1, Col 1</span>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-5 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  )
}
