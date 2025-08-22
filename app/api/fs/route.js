import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
const DATA_DIR = path.join(process.cwd(), "data");
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
                path: path.relative(DATA_DIR, fullPath).substring(37),
            };
        })
    );
    return files.sort((a, b) => (a.type === 'folder' ? -1 : 1));
}
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const filePath = searchParams.get("path");
    if (!userId) {
        return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }
    const userDir = path.join(DATA_DIR, userId);

    try {
        await fs.mkdir(userDir, { recursive: true });
        if (filePath) {
            const fullPath = path.join(userDir, filePath);
            const content = await fs.readFile(fullPath, "utf-8");
            return NextResponse.json({ success: true, content });
        } else {
            const files = await readDirectory(userDir);
            return NextResponse.json({ success: true, files });
        }
    } catch (error) {
        console.error("FS GET Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
export async function POST(req) {
    const { userId, path: newPath, type } = await req.json();
    if (!userId || !newPath || !type) {
        return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    const userDir = path.join(DATA_DIR, userId);
    const fullPath = path.join(userDir, newPath);
    try {
        if (type === "file") {
            await fs.writeFile(fullPath, "");
        } else if (type === "folder") {
            await fs.mkdir(fullPath, { recursive: true });
        }
        return NextResponse.json({ success: true, message: `${type} created successfully` });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
export async function PUT(req) {
    const { userId, action, oldPath, newPath, content, path: filePath } = await req.json();
    if (!userId) {
        return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }
    const userDir = path.join(DATA_DIR, userId);
    try {
        if (action === 'rename') {
            if (!oldPath || !newPath) return NextResponse.json({ success: false, error: "Old and new paths are required for rename" }, { status: 400 });
            await fs.rename(path.join(userDir, oldPath), path.join(userDir, newPath));
            return NextResponse.json({ success: true, message: "Renamed successfully" });
        } else {
            if (!filePath) return NextResponse.json({ success: false, error: "File path is required to save" }, { status: 400 });
            await fs.writeFile(path.join(userDir, filePath), content);
            return NextResponse.json({ success: true, message: "File saved successfully" });
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
export async function DELETE(req) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const filePath = searchParams.get("path");
    const type = searchParams.get("type");
    if (!userId || !filePath || !type) {
        return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 });
    }
    const userDir = path.join(DATA_DIR, userId);
    const fullPath = path.join(userDir, filePath);
    try {
        if (type === 'file') {
            await fs.unlink(fullPath);
        } else if (type === 'folder') {
            await fs.rm(fullPath, { recursive: true, force: true });
        }
        return NextResponse.json({ success: true, message: `${type} deleted successfully` });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}