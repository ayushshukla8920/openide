"use client"
import React, { useEffect, useRef, useState } from "react";
import { Terminal as TerminalIcon, Trash2 } from "lucide-react";
export function Terminal({ output, onClear, onInput }) {
    const terminalBodyRef = useRef(null);
    const [input, setInput] = useState('');
    useEffect(() => {
        if (terminalBodyRef.current) {
            terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
        }
    }, [output]);
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            onInput(input);
            setInput('');
        }
    };
    return (
        <div className="h-full bg-background flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 bg-muted border-b border-border">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Terminal</span>
                </div>
                <button onClick={onClear} className="p-1 hover:bg-accent rounded transition-colors" title="Clear Terminal">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
            <div ref={terminalBodyRef} className="flex-1 p-3 overflow-auto font-mono text-sm" onClick={() => document.getElementById('terminal-input-field')?.focus()}>
                <div className="whitespace-pre-wrap">
                    {output.map((line, index) => {
                        if (line.type === 'input') {
                            return (
                                <div key={index} className="flex items-start">
                                    <span className="text-gray-500 mr-2 select-none">$</span>
                                    <span className="text-gray-300">{line.data}</span>
                                </div>
                            )
                        }
                        return (
                            <span key={index} className={line.type === 'error' ? 'text-red-400' : 'text-gray-300'}>
                                {line.data}
                            </span>
                        )
                    })}
                </div>
                <div className="flex items-center">
                    <span className="text-gray-500 mr-2 select-none">$</span>
                    <input
                        id="terminal-input-field"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent text-gray-300 outline-none"
                        autoFocus
                    />
                </div>
            </div>
        </div>
    );
}