"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"


const sampleTabs = [
  {
    id: "1",
    name: "App.tsx",
    language: "typescript",
    content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to React</h1>
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;`,
  },
  {
    id: "2",
    name: "index.css",
    language: "css",
    content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`,
  },
]

export function CodeEditor({ activeFile }) {
  const [tabs, setTabs] = useState(sampleTabs)
  const [activeTabId, setActiveTabId] = useState("1")

  const closeTab = (tabId) => {
    const newTabs = tabs.filter((tab) => tab.id !== tabId)
    setTabs(newTabs)
    if (activeTabId === tabId && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id)
    }
  }

  const activeTab = tabs.find((tab) => tab.id === activeTabId)

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tab Bar */}
      <div className="flex bg-card border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm border-r border-border cursor-pointer min-w-0",
              "hover:bg-accent transition-colors",
              activeTabId === tab.id ? "bg-background text-foreground" : "bg-card text-muted-foreground",
            )}
            onClick={() => setActiveTabId(tab.id)}
          >
            <span className="truncate">{tab.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
              className="hover:bg-muted rounded p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Editor Content */}
      <div className="flex-1 relative">
        {activeTab ? (
          <div className="h-full flex">
            {/* Line Numbers */}
            <div className="bg-muted text-muted-foreground text-sm font-mono p-4 select-none border-r border-border">
              {activeTab.content.split("\n").map((_, index) => (
                <div key={index} className="leading-6 text-right pr-2">
                  {index + 1}
                </div>
              ))}
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto">
              <textarea
                className="w-full h-full p-4 bg-transparent text-foreground font-mono text-sm resize-none border-none outline-none leading-6"
                value={activeTab.content}
                onChange={(e) => {
                  const newTabs = tabs.map((tab) =>
                    tab.id === activeTabId ? { ...tab, content: e.target.value } : tab,
                  )
                  setTabs(newTabs)
                }}
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No file selected</p>
          </div>
        )}
      </div>
    </div>
  )
}
