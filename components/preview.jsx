"use client";
import { Monitor } from "lucide-react";
export function Preview({ htmlContent }) {
    const styledHtmlContent = `
        <html>
            <head>
                <style>
                    body {
                        background-color: white;
                        color: black;
                        font-family: sans-serif;
                    }
                </style>
            </head>
            <body>
                ${htmlContent}
            </body>
        </html>
    `;
    return (
        <div className="h-full bg-background flex flex-col">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted border-b border-border">
                <Monitor className="w-4 h-4" />
                <span className="text-sm font-medium">Preview</span>
            </div>
            <iframe
                srcDoc={styledHtmlContent}
                title="Live Preview"
                sandbox="allow-scripts"
                className="w-full h-full border-none bg-white"
            />
        </div>
    );
}