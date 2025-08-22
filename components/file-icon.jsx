import { File, Folder, FolderOpen, FileCode2, FileJson, Braces } from "lucide-react";
export function FileIcon({ filename, isFolder, isOpen }) {
  if (isFolder) {
    return isOpen ? <FolderOpen className="w-5 h-5 text-sky-400" /> : <Folder className="w-5 h-5 text-sky-400" />;
  }
  const extension = filename.split('.').pop();
  switch (extension) {
    case 'js':
    case 'ts':
        return <Braces className="w-5 h-5 text-yellow-400" />;
    case 'jsx':
    case 'tsx':
        return <Braces className="w-5 h-5 text-blue-400" />;
    case 'css':
        return <FileCode2 className="w-5 h-5 text-purple-400" />;
    case 'json':
        return <FileJson className="w-5 h-5 text-orange-400" />;
    case 'py':
        return <img src="/py.png" className="w-5 h-5 text-green-400" />;
    case 'java':
         return <img src="/java.png" className="w-5 h-5 text-green-400" />;
    case 'c':
        return <img src="/c.png" className="w-5 h-5 text-green-400" />;
    case 'cpp':
        return <img src="/cpp.png" className="w-5 h-5 text-green-400" />;
    case 'md':
        return <File className="w-5 h-5 text-gray-400" />;
    default:
        return <File className="w-5 h-5" />;
  }
}