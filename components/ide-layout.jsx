"use client"

import { useState, useEffect, useCallback, useRef } from "react";
import { Menu, X, Play, Save, Terminal as TerminalIcon } from "lucide-react";
import { FileExplorer } from "./file-explorer";
import { CodeEditor } from "./code-editor";
import { Terminal } from "./terminal";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "@/lib/utils";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Toaster, toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";

const path = { basename: (p) => p.split('/').pop() };
const getLanguageFromFileName = (fileName = '') => {
    const extension = fileName.split('.').pop();
    switch (extension) {
        case 'c': return 'c';
        case 'cpp': return 'cpp';
        case 'java': return 'java';
        case 'py': return 'python';
        default: return 'python';
    }
};

export function IDELayout() { 
    const [userId, setUserId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [files, setFiles] = useState([]);
    const [openTabs, setOpenTabs] = useState([]);
    const [activeTabId, setActiveTabId] = useState(null);
    const [terminalOutput, setTerminalOutput] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState("python");
    const [isSaving, setIsSaving] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    
    const terminalPanelRef = useRef(null);
    const [isTerminalCollapsed, setTerminalCollapsed] = useState(false);

    // No changes to the functions from here...
    useEffect(() => {
        const id = localStorage.getItem("userId");
        if (id) setUserId(id);
    }, []);

    const fetchFiles = useCallback(async () => {
        if (!userId) return;
        try {
            const res = await fetch(`/api/fs?userId=${userId}`);
            const data = await res.json();
            if (data.success) {
                setFiles(data.files);
            } else {
                toast.error("Failed to load files.");
            }
        } catch (error) {
            toast.error("An error occurred while fetching files.");
        }
    }, [userId]);

    useEffect(() => { fetchFiles(); }, [userId, fetchFiles]);
    
    useEffect(() => {
        const activeTab = openTabs.find(tab => tab.id === activeTabId);
        if (activeTab) {
            setSelectedLanguage(getLanguageFromFileName(activeTab.name));
        }
    }, [activeTabId, openTabs]);

    const handleFileSelect = async (filePath) => {
        const existingTab = openTabs.find(tab => tab.id === filePath);
        if (existingTab) {
            setActiveTabId(filePath);
            return;
        }

        const toastId = toast.loading(`Opening ${path.basename(filePath)}...`);
        try {
            const res = await fetch(`/api/fs?userId=${userId}&path=${encodeURIComponent(filePath)}`);
            const data = await res.json();
            if (data.success) {
                const newTab = { id: filePath, name: path.basename(filePath), content: data.content };
                setOpenTabs(prev => [...prev, newTab]);
                setActiveTabId(filePath);
                toast.dismiss(toastId);
            } else {
                 toast.error(`Failed to open file: ${data.error}`, { id: toastId });
            }
        } catch (error) {
            toast.error("An error occurred while opening the file.", { id: toastId });
        }
    };

    const handleCreate = async (fullPath, type) => {
        const toastId = toast.loading(`Creating ${type}...`);
        try {
            const res = await fetch('/api/fs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, path: fullPath, type }),
            });
            if (res.ok) {
                 toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} created successfully.`, { id: toastId });
                 fetchFiles();
            } else {
                const data = await res.json();
                toast.error(`Failed to create ${type}: ${data.error}`, { id: toastId });
            }
        } catch (error) {
            toast.error(`An error occurred while creating the ${type}.`, { id: toastId });
        }
    };
    
    const handleTabClose = (tabId) => {
        const newTabs = openTabs.filter(tab => tab.id !== tabId);
        setOpenTabs(newTabs);
        if (activeTabId === tabId) {
            setActiveTabId(newTabs.length > 0 ? newTabs[0].id : null);
        }
    };

    const handleCodeChange = (newCode, tabId) => {
        const newTabs = openTabs.map(tab =>
            tab.id === tabId ? { ...tab, content: newCode } : tab
        );
        setOpenTabs(newTabs);
    };

    const handleSave = async () => {
        const activeTab = openTabs.find(tab => tab.id === activeTabId);
        if (!activeTab) return;
        setIsSaving(true);
        const toastId = toast.loading("Saving file...");
        try {
            const res = await fetch('/api/fs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, path: activeTab.id, content: activeTab.content })
            });
            if (res.ok) {
                toast.success("File saved successfully!", { id: toastId });
            } else {
                toast.error("Failed to save file.", { id: toastId });
            }
        } catch (error) {
            toast.error("An error occurred while saving.", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleRun = async () => {
        const activeTab = openTabs.find(tab => tab.id === activeTabId);
        if (!activeTab) {
            toast.error("No active file to run.");
            return;
        }

        // --- FIX: Use the state variable to check if collapsed ---
        if (isTerminalCollapsed) {
            terminalPanelRef.current?.expand();
        }

        setIsRunning(true);
        setTerminalOutput(prev => [...prev, {type: 'info', data: `Executing ${activeTab.name}...`}]);

        try {
            const res = await fetch('/api/compile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, code: activeTab.content, lang: selectedLanguage })
            });
            const result = await res.json();
             if (result.success) {
                setTerminalOutput(prev => [...prev, { type: 'success', data: result.output }]);
            } else {
                setTerminalOutput(prev => [...prev, { type: 'error', data: result.error }]);
            }
        } catch (error) {
            setTerminalOutput(prev => [...prev, { type: 'error', data: error.message }]);
        } finally {
            setIsRunning(false);
        }
    };
    
    const handleToggleTerminal = () => {
        const panel = terminalPanelRef.current;
        if (panel) {
            if (isTerminalCollapsed) {
                panel.expand();
                setTerminalCollapsed(false);
            } else {
                panel.collapse();
                setTerminalCollapsed(true);
            }
        }
    };

    return (
        <div className="h-screen bg-background text-foreground flex flex-col">
            <Toaster position="top-right" richColors />
            <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`p-2 hover:bg-accent rounded transition-colors`}>
                        {sidebarOpen ? <Menu className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                    <div className="font-bold text-lg">OpenIDE</div>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                        <SelectTrigger className="w-[50px] h-8 bg-card">
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="c">C</SelectItem>
                            <SelectItem value="cpp">C++</SelectItem>
                            <SelectItem value="java">Java</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={handleSave} disabled={isSaving || !activeTabId}>
                        <Save className={cn("w-4 h-4", isSaving && "animate-spin")} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleRun} disabled={isRunning || !activeTabId}>
                        <Play className={cn("w-4 h-4", isRunning && "animate-ping")} />
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <PanelGroup direction="horizontal">
                    {sidebarOpen && (
                        <>
                            <Panel defaultSize={isDesktop ? 5 : 40} minSize={15} maxSize={isDesktop ? 15 : 40}>
                                <FileExplorer files={files} onFileSelect={handleFileSelect} onCreate={handleCreate} />
                            </Panel>
                            <PanelResizeHandle className="w-1 bg-border hover:bg-primary transition-colors" />
                        </>
                    )}
                    <Panel>
                        <PanelGroup direction="vertical">
                            <Panel defaultSize={70} minSize={20}>
                                <CodeEditor
                                    openTabs={openTabs}
                                    activeTabId={activeTabId}
                                    onTabClick={setActiveTabId}
                                    onTabClose={handleTabClose}
                                    onCodeChange={handleCodeChange}
                                />
                            </Panel>
                            <PanelResizeHandle className="h-1 bg-border hover:bg-primary transition-colors" />
                            <Panel ref={terminalPanelRef} defaultSize={30} minSize={10} collapsible={true} onCollapse={(collapsed) => setTerminalCollapsed(collapsed)}>
                                <Terminal output={terminalOutput} onClear={() => setTerminalOutput([])} />
                            </Panel>
                        </PanelGroup>
                    </Panel>
                </PanelGroup>
            </div>

            <div className="bg-[#457EFF] border-t border-border px-4 py-1 text-sm flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                </div>
                <button onClick={handleToggleTerminal} className="flex items-center gap-2 hover:bg-accent px-2 py-0.5 rounded transition-colors">
                    <TerminalIcon className="w-4 h-4" />
                    {isTerminalCollapsed ? "Show Terminal" : "Hide Terminal"}
                </button>
            </div>
        </div>
    );
}