"use client"
import { useState } from "react";
import { ChevronRight, ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { FileIcon } from "./file-icon";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { toast } from "sonner";
function FileTree({ files, onFileSelect, onRename, onDelete, onNodeClick, selectedPath, level = 0, parentPath = "" }) {
  const [openFolders, setOpenFolders] = useState(new Set());
  const toggleFolder = (folderName) => {
    const newOpenFolders = new Set(openFolders);
    if (newOpenFolders.has(folderName)) {
      newOpenFolders.delete(folderName);
    } else {
      newOpenFolders.add(folderName);
    }
    setOpenFolders(newOpenFolders);
  };
  return (
    <div>
      {files.map((file) => {
        const currentPath = parentPath ? `${parentPath}/${file.name}` : file.name;
        const isSelected = selectedPath === currentPath;
        return (
          <ContextMenu key={currentPath}>
            <ContextMenuTrigger asChild>
              <div key={currentPath}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-white/20 transition-colors rounded-md mx-1",
                    isSelected && "bg-white/20"
                  )}
                  style={{ paddingLeft: `${level * 16 + 8}px` }}
                  onClick={() => {
                    onNodeClick(currentPath, file.type);
                    if (file.type === "folder") {
                      toggleFolder(file.name);
                    } else {
                      onFileSelect?.(currentPath);
                    }
                  }}
                >
                  {file.type === "folder" ? (
                    <>
                      {openFolders.has(file.name) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <FileIcon filename={file.name} isFolder isOpen={openFolders.has(file.name)} />
                    </>
                  ) : (
                    <>
                      <div className="w-4" />
                      <FileIcon filename={file.name} />
                    </>
                  )}
                  <span className="truncate">{file.name}</span>
                </div>
                {file.type === "folder" && openFolders.has(file.name) && file.children && (
                  <FileTree
                    files={file.children}
                    level={level + 1}
                    onFileSelect={onFileSelect}
                    onNodeClick={onNodeClick}
                    selectedPath={selectedPath}
                    parentPath={currentPath}
                  />
                )}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="w-48">
              <ContextMenuItem
                onSelect={() => onRename(currentPath, file.type)}
              >
                Rename
              </ContextMenuItem>
              <ContextMenuItem
                className="text-red-500 focus:text-red-500"
                onSelect={() => onDelete(currentPath, file.type)}
              >
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );
}
export function FileExplorer({ files, onFileSelect, onCreate, onRename, onDelete }) {
  const [selectedNode, setSelectedNode] = useState({ path: '', type: 'folder' });
  const handleCreate = (type) => {
    const name = prompt(`Enter ${type} name:`);
    if (name) {
      let basePath = '';
      if (selectedNode.path) {
        basePath = selectedNode.type === 'folder'
          ? selectedNode.path
          : selectedNode.path.substring(0, selectedNode.path.lastIndexOf('/'));
      }
      const fullPath = basePath ? `${basePath}/${name}` : name;
      onCreate(fullPath, type);
    }
  }
  const handleNodeClick = (path, type) => {
    setSelectedNode({ path, type });
  };
  return (
    <div className="h-full bg-card flex flex-col">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide">Explorer</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => handleCreate('file')} className="p-1 hover:bg-accent rounded" title="New File">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <FileTree
          files={files}
          onFileSelect={onFileSelect}
          onRename={onRename}
          onDelete={onDelete}
          onNodeClick={handleNodeClick}
          selectedPath={selectedNode.path}
        />
      </div>
    </div>
  );
}