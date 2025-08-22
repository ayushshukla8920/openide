"use client"

import  React from "react"

import { useState } from "react"
import { TerminalIcon, X, Minus, Square } from "lucide-react"

export function Terminal() {
  const [input, setInput] = useState("")
  const [history, setHistory] = useState([
    "Welcome to the integrated terminal!",
    "$ npm start",
    "Starting development server...",
    "Local: http://localhost:3000",
    "$ ",
  ])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (input.trim()) {
      setHistory((prev) => [...prev, `$ ${input}`, "Command executed successfully", "$ "])
      setInput("")
    }
  }

  return (
    <div className="h-full bg-card border-t border-border flex flex-col">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted border-b border-border">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-foreground" />
          <span className="text-sm font-medium text-foreground">Terminal</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-accent rounded transition-colors">
            <Minus className="w-3 h-3 text-foreground" />
          </button>
          <button className="p-1 hover:bg-accent rounded transition-colors">
            <Square className="w-3 h-3 text-foreground" />
          </button>
          <button className="p-1 hover:bg-accent rounded transition-colors">
            <X className="w-3 h-3 text-foreground" />
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-3 overflow-auto font-mono text-sm">
        <div className="space-y-1">
          {history.map((line, index) => (
            <div key={index} className={line.startsWith("$") ? "text-primary" : "text-foreground"}>
              {line}
            </div>
          ))}
        </div>

        {/* Input Line */}
        <form onSubmit={handleSubmit} className="flex items-center mt-2">
          <span className="text-primary mr-2">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent text-foreground outline-none"
            placeholder="Type a command..."
            autoFocus
          />
        </form>
      </div>
    </div>
  )
}
