"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"

const sampleFiles = [
  {
    name: "src",
    type: "folder",
    isOpen: true,
    children: [
      {
        name: "components",
        type: "folder",
        children: [
          { name: "Header.tsx", type: "file" },
          { name: "Sidebar.tsx", type: "file" },
          { name: "Button.tsx", type: "file" },
        ],
      },
      {
        name: "pages",
        type: "folder",
        children: [
          { name: "index.tsx", type: "file" },
          { name: "about.tsx", type: "file" },
        ],
      },
      { name: "App.tsx", type: "file" },
      { name: "index.css", type: "file" },
    ],
  },
  {
    name: "public",
    type: "folder",
    children: [
      { name: "favicon.ico", type: "file" },
      { name: "logo.png", type: "file" },
    ],
  },
  { name: "package.json", type: "file" },
  { name: "README.md", type: "file" },
]

function FileTree({ files, level = 0, onFileSelect }) {
  const [openFolders, setOpenFolders] = useState(new Set(["src"]))

  const toggleFolder = (folderName) => {
    const newOpenFolders = new Set(openFolders)
    if (newOpenFolders.has(folderName)) {
      newOpenFolders.delete(folderName)
    } else {
      newOpenFolders.add(folderName)
    }
    setOpenFolders(newOpenFolders)
  }

  return (
    <div>
      {files.map((file, index) => (
        <div key={index}>
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 text-sm cursor-pointer hover:bg-sidebar-accent transition-colors",
              "text-gray-400",
            )}
            style={{ paddingLeft: `${level * 12 + 8}px` }}
            onClick={() => {
              if (file.type === "folder") {
                toggleFolder(file.name)
              } else {
                onFileSelect?.(file.name)
              }
            }}
          >
            {file.type === "folder" ? (
              <>
                {openFolders.has(file.name) ? (
                  <ChevronDown className="w-4 h-4 text-sidebar-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-sidebar-foreground" />
                )}
                {openFolders.has(file.name) ? (
                  <FolderOpen className="w-4 h-4 text-sidebar-accent" />
                ) : (
                  <Folder className="w-4 h-4 text-sidebar-accent" />
                )}
              </>
            ) : (
              <>
                <div className="w-4" />
                <File className="w-4 h-4 text-sidebar-foreground" />
              </>
            )}
            <span className="truncate">{file.name}</span>
          </div>
          {file.type === "folder" && openFolders.has(file.name) && file.children && (
            <FileTree files={file.children} level={level + 1} onFileSelect={onFileSelect} />
          )}
        </div>
      ))}
    </div>
  )
}
export function FileExplorer({ onFileSelect }) {
  return (
    <div className="h-full bg-[#0A0A0A] border-r border-sidebar-border">
      <div className="p-3 border-b border-sidebar-border">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Explorer</h2>
      </div>
      <div className="overflow-auto">
        <FileTree files={sampleFiles} onFileSelect={onFileSelect} />
      </div>
    </div>
  )
}