import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';
import path from "path";

const execPromise = util.promisify(exec);

const extensions = {
    "c": { extension: ".c", compiler: "gcc" },
    "cpp": { extension: ".cpp", compiler: "g++" },
    "java": { extension: ".java", compiler: "javac" },
    "python": { extension: ".py", compiler: "python3" }
};

export const POST = async (req) => {
    const { code, lang, userId } = await req.json();

    if (!userId) {
        return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const userDir = path.join(process.cwd(), "data", userId);
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }

    try {
        if (lang === "java") {
            const classNameMatch = code.match(/public\s+class\s+([a-zA-Z_]\w*)/);
            if (!classNameMatch) {
                return NextResponse.json({ success: false, error: "No public class found in Java code." }, { status: 400 });
            }
            const className = classNameMatch[1];
            const filePath = path.join(userDir, `${className}.java`);
            fs.writeFileSync(filePath, code);

            await execPromise(`javac ${filePath}`);
            const { stdout, stderr } = await execPromise(`java -cp ${userDir} ${className}`);
            if (stderr) return NextResponse.json({ success: false, error: stderr }, { status: 400 });
            return NextResponse.json({ success: true, output: stdout });

        } else {
            const uuid = uuidv4();
            const compiler = extensions[lang];
            if (!compiler) {
                return NextResponse.json({ success: false, error: "Unsupported language" }, { status: 400 });
            }
            const filePath = path.join(userDir, uuid + compiler.extension);
            fs.writeFileSync(filePath, code);

            let command;
            if (lang === "c" || lang === "cpp") {
                const outPath = path.join(userDir, `${uuid}.out`);
                command = `${compiler.compiler} ${filePath} -o ${outPath} && ${outPath}`;
            } else { // Python
                command = `${compiler.compiler} ${filePath}`;
            }
            
            const { stdout, stderr } = await execPromise(command);
            if (stderr) return NextResponse.json({ success: false, error: stderr }, { status: 400 });
            return NextResponse.json({ success: true, output: stdout });
        }
    } catch (err) {
        // The 'err' object from execPromise often contains stdout and stderr
        const errorOutput = err.stderr || err.stdout || err.message;
        return NextResponse.json({ success: false, error: errorOutput }, { status: 500 });
    }
};