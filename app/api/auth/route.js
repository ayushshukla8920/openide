import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
const USERS_FILE = path.join(process.cwd(), "db", "users.json");
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(path.dirname(USERS_FILE))) fs.mkdirSync(path.dirname(USERS_FILE));
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]));
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
export const POST = async (req) => {
    try {
        const body = await req.json();
        const { action, username, password } = body;
        if (!username || !password) {
            return NextResponse.json({ success: false, error: "Username and password required" }, { status: 400 });
        }
        let users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
        if (action === "signup") {
            const exists = users.find(u => u.username === username);
            if (exists) {
                return NextResponse.json({ success: false, error: "Username already exists" }, { status: 400 });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = { id: uuidv4(), username, password: hashedPassword };
            users.push(newUser);
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
            const userDir = path.join(DATA_DIR, newUser.id);
            if (!fs.existsSync(userDir)) fs.mkdirSync(userDir);
            return NextResponse.json({ success: true, message: "User registered", userId: newUser.id });
        } else if (action === "login") {
            const user = users.find(u => u.username === username);
            if (!user) return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 400 });
            const valid = await bcrypt.compare(password, user.password);
            if (!valid) return NextResponse.json({ success: false, error: "Invalid username or password" }, { status: 400 });
            return NextResponse.json({ success: true, message: "Login successful", userId: user.id });
        } else {
            return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
        }
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
};
