import { File, Folder, FolderOpen, FileCode2, FileJson, Braces } from "lucide-react";

export function FileIcon({ filename, isFolder, isOpen }) {
  if (isFolder) {
    // Correctly use the imported FolderOpen icon when isOpen is true
    return isOpen ? <FolderOpen className="w-4 h-4 text-sky-400" /> : <Folder className="w-4 h-4 text-sky-400" />;
  }

  const extension = filename.split('.').pop();

  switch (extension) {
    case 'js':
    case 'ts':
        return <Braces className="w-4 h-4 text-yellow-400" />;
    case 'jsx':
    case 'tsx':
        return <Braces className="w-4 h-4 text-blue-400" />;
    case 'css':
        return <FileCode2 className="w-4 h-4 text-purple-400" />;
    case 'json':
        return <FileJson className="w-4 h-4 text-orange-400" />;
    case 'py':
        return <FileCode2 className="w-4 h-4 text-green-400" />;
    case 'java':
         return <FileCode2 className="w-4 h-4 text-red-500" />;
    case 'c':
    case 'cpp':
        return <FileCode2 className="w-4 h-4 text-indigo-400" />;
    case 'md':
        return <File className="w-4 h-4 text-gray-400" />;
    default:
        return <File className="w-4 h-4" />;
  }
}