"use client"
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { autocompletion } from '@codemirror/autocomplete';
const htmlBoilerplate = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
  </head>
  <body>
    
  </body>
</html>`;
const htmlCompletion = (context) => {
  let before = context.matchBefore(/!/);
  if (!before) return null;

  return {
    from: before.from,
    options: [
      {
        label: "!",
        apply: htmlBoilerplate,
        type: "snippet",
        detail: "HTML Boilerplate"
      }
    ]
  };
};
const languageExtensions = {
  js: [javascript({ jsx: true })],
  html: [html({ extraLangs: [javascript, css] }), autocompletion({ override: [htmlCompletion] })],
  ts: [javascript({ typescript: true })],
  tsx: [javascript({ typescript: true, jsx: true })],
  cpp: [cpp()],
  c: [cpp()],
  java: [java()],
  py: [python()],
  json: [javascript()],
  css: [css()],
};
const getLanguageExtension = (fileName) => {
    const extension = fileName.split('.').pop();
    return languageExtensions[extension] || [];
}
export function CodeEditor({ openTabs, activeTabId, onTabClose, onTabClick, onCodeChange }) {
  const activeTab = openTabs.find((tab) => tab.id === activeTabId);
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex bg-card border-b border-border overflow-x-auto">
        {openTabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm border-r border-border cursor-pointer min-w-0",
              "hover:bg-accent transition-colors",
              activeTabId === tab.id ? "bg-background text-foreground" : "bg-card text-muted-foreground",
            )}
            onClick={() => onTabClick(tab.id)}
          >
            <span className="truncate">{tab.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              className="hover:bg-muted rounded p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex-1 relative overflow-hidden font-bold text-lg">
        {activeTab ? (
          <CodeMirror
            value={activeTab.content}
            height="100%"
            theme={oneDark}
            extensions={[
                ...getLanguageExtension(activeTab.name),
                syntaxHighlighting(defaultHighlightStyle, { fallback: true })
            ]}
            onChange={(value) => onCodeChange(value, activeTab.id)}
            style={{ height: '100%' }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Select a file to start coding</p>
          </div>
        )}
      </div>
    </div>
  );
}