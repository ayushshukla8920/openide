import { File, Folder, FolderOpen, FileCode2, FileJson, Braces } from "lucide-react";
export function FileIcon({ filename, isFolder, isOpen }) {
  if (isFolder) {
    return isOpen ? <FolderOpen className="w-5 h-5 text-sky-400" /> : <Folder className="w-5 h-5 text-sky-400" />;
  }
  const extension = filename.split('.').pop();
  switch (extension) {
    case 'js':
        return <img src="/js.png" className="w-5 h-5 text-green-400" />;
    case 'html':
        return <img src="/html.png" className="w-5 h-5 text-green-400" />;
    case 'css':
        return <img src="/css.png" className="w-5 h-5 text-green-400" />;
    case 'ts':
        return <img src="/ts.png" className="w-5 h-5 text-green-400" />;
    case 'jsx':
        return <img src="/jsx.png" className="w-6 h-5 text-green-400" />;
    case 'tsx':
        return <img src="/tsx.png" className="w-6 h-5 text-green-400" />;
    case 'json':
        return <Braces className="w-5 h-5 text-yellow-400" />;
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