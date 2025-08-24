"use client"
import { useState, useEffect, useCallback, useRef } from "react";
import io from 'socket.io-client';
import { Menu, CheckCheck, Maximize, Play, LogOut, Terminal as TerminalIcon, Monitor, Ban } from "lucide-react";
import { FileExplorer } from "./file-explorer";
import { CodeEditor } from "./code-editor";
import { Terminal } from "./terminal";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { cn } from "@/lib/utils";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Toaster, toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useDebounce } from "@/hooks/use-debounce";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Preview } from "./preview";
const path = {
    basename: (p) => p ? p.split('/').pop() : '',
    dirname: (p) => p ? p.substring(0, p.lastIndexOf('/')) : '',
    join: (...args) => args.filter(Boolean).join('/'),
};
const getLanguageFromFileName = (fileName = '') => {
    const extension = fileName.split('.').pop();
    switch (extension) {
        case 'c': return 'c';
        case 'cpp': return 'cpp';
        case 'java': return 'java';
        case 'py': return 'python';
        case 'js': return 'js';
        case 'html': return 'html';
        default: return 'js';
    }
};
let socket;
export function IDELayout() {
    const [bottomPanelMode, setBottomPanelMode] = useState('terminal');
    const [modalState, setModalState] = useState({ isOpen: false, type: 'null', data: {} });
    const [modalInput, setModalInput] = useState('');
    const [previewContent, setPreviewContent] = useState('');
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
    const [saved, setsaved] = useState(false);
    const terminalPanelRef = useRef(null);
    const [isTerminalCollapsed, setTerminalCollapsed] = useState(false);
    const [dirtyContent, setDirtyContent] = useState(null);
    const debouncedDirtyContent = useDebounce(dirtyContent, 1500);
    const [isAppVisible, setIsAppVisible] = useState(false);
    function attemptFullscreen() {
        const element = document.documentElement;
        if (element.requestFullscreen) element.requestFullscreen();
        else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
        else if (element.mozRequestFullScreen) element.mozRequestFullScreen();
        else if (element.msRequestFullscreen) element.msRequestFullscreen();
    }
    const handleEnterApp = () => {
        attemptFullscreen();
        setIsAppVisible(true);
    };
    useEffect(() => {
        if (debouncedDirtyContent) {
            handleSave(debouncedDirtyContent.tabId, debouncedDirtyContent.content);
        }
    }, [debouncedDirtyContent]);
    useEffect(() => {
        socket = io();
        socket.on('connect', () => {
            console.log('Connected to custom server!');
        });
        socket.on('output', (data) => {
            setTerminalOutput(prev => [...prev, data]);
        });
        return () => {
            if (socket) socket.disconnect();
        };
    }, []);
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
    const handleCreate = (fullPath, type) => {
        const parentPath = path.dirname(fullPath);
        setModalState({
            isOpen: true,
            type: `create_${type}`,
            data: { parentPath },
        });
        setModalInput('');
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
        setDirtyContent({ tabId, content: newCode });
    };
    const triggerState = () => {
        setsaved(true);
        setTimeout(() => {
            setsaved(false);
        }, 1500);
    };
    const handleLogout = () => {
        localStorage.removeItem('userId');
        window.location.reload();
    }
    const handleSave = async (tabIdToSave, contentToSave) => {
        const tabToSave = tabIdToSave
            ? openTabs.find(tab => tab.id === tabIdToSave)
            : openTabs.find(tab => tab.id === activeTabId);
        if (!tabToSave) return;
        const finalContent = contentToSave ?? tabToSave.content;
        setIsSaving(true);
        if (selectedLanguage == 'html' && bottomPanelMode == 'preview') {
            handleRun();
        }
        try {
            const res = await fetch('/api/fs', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, path: tabToSave.id, content: finalContent })
            });
            if (res.ok) {
                triggerState();
                if (dirtyContent && dirtyContent.tabId === tabToSave.id) setDirtyContent(null);
            } else {
                toast.error("Failed to save file.");
            }
        } catch (error) {
            toast.error("An error occurred while saving.");
        } finally {
            setIsSaving(false);
        }
    };
    const handleRename = (oldPath, type) => {
        setModalState({
            isOpen: true,
            type: 'rename',
            data: { oldPath, type },
        });
        setModalInput(path.basename(oldPath));
    };

    const handleDelete = (pathToDelete, type) => {
        setModalState({
            isOpen: true,
            type: 'delete',
            data: { pathToDelete, type },
        });
    };
    const handleRun = () => {
        const activeTab = openTabs.find(tab => tab.id === activeTabId);
        if (!activeTab) {
            toast.error("No active file to run.");
            return;
        }
        const language = selectedLanguage;
        if (language === 'html') {
            setPreviewContent(activeTab.content);
            setBottomPanelMode('preview');
            if (isTerminalCollapsed) {
                terminalPanelRef.current?.expand();
            }
        } else {
            setBottomPanelMode('terminal');
            if (isTerminalCollapsed) {
                terminalPanelRef.current?.expand();
            }
            setTerminalOutput([]);
            socket.emit('run-code', {
                userId,
                code: activeTab.content,
                lang: language
            });
        }
    };
    const handleTerminalInput = (input) => {
        socket.emit('terminal-input', input);
        setTerminalOutput(prev => [...prev, { type: 'input', data: input }]);
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
    const handleModalSubmit = async () => {
        const { type, data } = modalState;
        let toastId;
        try {
            if (type === 'create_file' || type === 'create_folder') {
                const itemType = type.split('_')[1];
                const fullPath = path.join(data.parentPath, modalInput);
                toastId = toast.loading(`Creating ${itemType}...`);
                const res = await fetch('/api/fs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, path: fullPath, type: itemType }),
                });
                if (!res.ok) throw new Error('Failed to create');
                toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} created.`, { id: toastId });
                await fetchFiles();
            }
            else if (type === 'rename') {
                const { oldPath } = data;
                const newPath = path.join(path.dirname(oldPath), modalInput);
                toastId = toast.loading(`Renaming...`);
                const res = await fetch('/api/fs', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, action: 'rename', oldPath, newPath }),
                });
                if (!res.ok) throw new Error('Failed to rename');
                toast.success("Renamed successfully.", { id: toastId });
                await fetchFiles();
                const newTabs = openTabs.map(tab => tab.id === oldPath ? { ...tab, id: newPath, name: modalInput } : tab);
                setOpenTabs(newTabs);
                if (activeTabId === oldPath) setActiveTabId(newPath);
            }
            else if (type === 'delete') {
                const { pathToDelete, type } = data;
                toastId = toast.loading(`Deleting ${type}...`);
                const res = await fetch(`/api/fs?userId=${userId}&path=${encodeURIComponent(pathToDelete)}&type=${type}`, {
                    method: 'DELETE',
                });
                if (!res.ok) throw new Error('Failed to delete');
                toast.success("Deleted successfully.", { id: toastId });
                await fetchFiles();
                handleTabClose(pathToDelete);
            }
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setModalState({ isOpen: false, type: null, data: {} });
        }
    };
    const modalContent = {
        'create_file': { title: 'Create New File', description: 'Enter the name for the new file.', showInput: true, buttonText: 'Create' },
        'create_folder': { title: 'Create New Folder', description: 'Enter the name for the new folder.', showInput: true, buttonText: 'Create' },
        'rename': { title: 'Rename Item', description: 'Enter the new name.', showInput: true, buttonText: 'Rename' },
        'delete': { title: 'Delete Item', description: 'This action cannot be undone.', showInput: false, buttonText: 'Delete', buttonVariant: 'destructive' },
    };
    const currentModal = modalContent[modalState.type];
    if (!isAppVisible) {
        return (
            <div
                className="w-full h-screen bg-background text-foreground flex flex-col items-center justify-center cursor-pointer"
                onClick={handleEnterApp}
            >
                <div className="text-center">
                    <Maximize className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <h1 className="text-2xl font-bold mb-2">Enter Fullscreen Mode</h1>
                    <p className="text-gray-400">Click anywhere to start your immersive coding session.</p>
                </div>
            </div>
        );
    }
    return (
        <div className="h-screen bg-background text-foreground flex flex-col">
            <Dialog open={modalState.isOpen} onOpenChange={(isOpen) => !isOpen && setModalState({ isOpen: false, type: null, data: {} })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {modalState.type === 'rename' ? `Rename ${modalState.data.type}` :
                                modalState.type === 'delete' ? `Delete ${modalState.data.type}` :
                                    currentModal?.title}
                        </DialogTitle>
                        <DialogDescription>
                            {modalState.type === 'delete'
                                ? `Are you sure you want to delete "${path.basename(modalState.data.pathToDelete)}"? ${currentModal?.description}`
                                : currentModal?.description
                            }
                        </DialogDescription>
                    </DialogHeader>
                    {currentModal?.showInput && (
                        <Input
                            value={modalInput}
                            onChange={(e) => setModalInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleModalSubmit()}
                            autoFocus
                        />
                    )}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setModalState({ isOpen: false, type: null, data: {} })}>Cancel</Button>
                        <Button variant={currentModal?.buttonVariant} onClick={handleModalSubmit}>{currentModal?.buttonText}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
                        <SelectTrigger className="w-[100px] h-8 bg-card justify-end">
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="c">C</SelectItem>
                            <SelectItem value="cpp">C++</SelectItem>
                            <SelectItem value="java">Java</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="js">JS</SelectItem>
                            <SelectItem value="html">HTML</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={handleRun} disabled={isRunning || !activeTabId}>
                        <Play className={cn("w-4 h-4", isRunning && "animate-ping")} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                        <LogOut className={cn("w-4 h-4", isSaving && "animate-spin")} />
                    </Button>
                </div>
            </div>
            <div className="flex-1 flex overflow-hidden">
                <PanelGroup direction="horizontal">
                    {sidebarOpen && (
                        <>
                            <Panel defaultSize={isDesktop ? 5 : 40} minSize={15} maxSize={isDesktop ? 15 : 40}>
                                <FileExplorer
                                    files={files}
                                    onFileSelect={handleFileSelect}
                                    onCreate={handleCreate}
                                    onRename={handleRename}
                                    onDelete={handleDelete}
                                />
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
                            <Panel ref={terminalPanelRef} defaultSize={30} minSize={10} collapsible={true} onCollapse={setTerminalCollapsed}>
                                {bottomPanelMode === 'terminal' ? (
                                    <Terminal
                                        output={terminalOutput}
                                        onClear={() => setTerminalOutput([])}
                                        onInput={handleTerminalInput}
                                    />
                                ) : (
                                    <Preview htmlContent={previewContent} />
                                )}
                            </Panel>
                        </PanelGroup>
                    </Panel>
                </PanelGroup>
            </div>
            <div className="bg-[#457EFF] border-t border-border px-4 py-1 text-sm flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    {selectedLanguage.toUpperCase()} &nbsp;&nbsp;&nbsp;&nbsp;UTF-8
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => { (bottomPanelMode == 'preview') ? setBottomPanelMode('terminal') : handleToggleTerminal(); }} className="items-center flex gap-2 hover:bg-accent px-2 py-0.5 rounded transition-colors">
                        {saved ? <><CheckCheck className="w-4 h-4" /> Saved&nbsp;&nbsp;</> : ""}
                        <TerminalIcon className="w-4 h-4" />
                        {(!isTerminalCollapsed && bottomPanelMode == 'preview') ? "Show Terminal" : (isTerminalCollapsed) ? "Show Terminal" : "Hide Terminal"}
                    </button>
                    <button
                        onClick={() => { bottomPanelMode == 'preview' ? setBottomPanelMode('terminal') : setBottomPanelMode('preview'); handleRun() }}
                        className={cn("items-center flex gap-2 px-2 py-0.5 rounded transition-colors", bottomPanelMode === 'preview' ? 'bg-accent' : 'hover:bg-accent')}
                    >
                        {bottomPanelMode == 'preview' ? <Ban className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                        {bottomPanelMode == 'preview' ? 'Stop' : 'Go Live'}
                    </button>
                </div>
            </div>
        </div>
    );
}
