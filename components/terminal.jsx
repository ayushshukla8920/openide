"use client"
import React, { useEffect, useRef } from "react";
import { Terminal as TerminalIcon, Trash2 } from "lucide-react";

export function Terminal({ output, onClear }) {
    const terminalBodyRef = useRef(null);

    // Auto-scroll to the bottom on new output
    useEffect(() => {
        if (terminalBodyRef.current) {
            terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
        }
    }, [output]);

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
            <div ref={terminalBodyRef} className="flex-1 p-3 overflow-auto font-mono text-sm whitespace-pre-wrap">
                {output.map((line, index) => (
                    <div key={index} className="flex items-start">
                       <span className="text-gray-500 mr-2 select-none">$</span> 
                       <span className={line.type === 'error' ? 'text-red-400' : 'text-gray-300'}>
                         {line.data}
                       </span>
                    </div>
                ))}
            </div>
        </div>
    );
}