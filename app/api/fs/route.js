import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

// Helper function to recursively read directory structure
async function readDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(async (entry) => {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                return {
                    name: entry.name,
                    type: "folder",
                    children: await readDirectory(fullPath),
                };
            }
            return {
                name: entry.name,
                type: "file",
                path: path.relative(DATA_DIR, fullPath).substring(37), // remove userId from path
            };
        })
    );
    return files.sort((a, b) => (a.type === 'folder' ? -1 : 1)); // Folders first
}

// GET: To list files or get file content
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const filePath = searchParams.get("path");

    if (!userId) {
        return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const userDir = path.join(DATA_DIR, userId);

    try {
        await fs.mkdir(userDir, { recursive: true }); // Ensure user directory exists

        if (filePath) {
            // Get content of a specific file
            const fullPath = path.join(userDir, filePath);
            const content = await fs.readFile(fullPath, "utf-8");
            return NextResponse.json({ success: true, content });
        } else {
            // List all files and folders
            const files = await readDirectory(userDir);
            return NextResponse.json({ success: true, files });
        }
    } catch (error) {
        console.error("FS GET Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST: To create a new file or folder
export async function POST(req) {
    const { userId, path: newPath, type } = await req.json();

    if (!userId || !newPath || !type) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const userDir = path.join(DATA_DIR, userId);
    const fullPath = path.join(userDir, newPath);

    try {
        if (type === "file") {
            await fs.writeFile(fullPath, ""); // Create an empty file
        } else if (type === "folder") {
            await fs.mkdir(fullPath, { recursive: true });
        }
        return NextResponse.json({ success: true, message: `${type} created successfully` });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


// PUT: To save/update file content
export async function PUT(req) {
    const { userId, path: filePath, content } = await req.json();

     if (!userId || !filePath) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const userDir = path.join(DATA_DIR, userId);
    const fullPath = path.join(userDir, filePath);

    try {
        await fs.writeFile(fullPath, content);
        return NextResponse.json({ success: true, message: "File saved successfully" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}