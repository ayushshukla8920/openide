import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';
import path from "path";

const execPromise = util.promisify(exec);

const extensions = {
    "C": { extension: ".c", compiler: "gcc" },
    "C++": { extension: ".cpp", compiler: "g++" },
    "Java": { extension: ".java", compiler: "javac" },
    "Python": { extension: ".py", compiler: "python3" }
}

export const POST = async (req) => {
    const body = await req.json();
    let CODE_TO_EXECUTE = body.code;
    const language = body.lang;

    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);

    try {
        if (language === "Java") {
            // generate a valid class name
            const className = "Main_" + Math.floor(Math.random() * 100000);

            // replace existing public class name with valid class name
            CODE_TO_EXECUTE = CODE_TO_EXECUTE.replace(/public\s+class\s+\w+/, `public class ${className}`);
            const filePath = path.join(dir, className + ".java");
            fs.writeFileSync(filePath, CODE_TO_EXECUTE);

            // compile
            await execPromise(`javac ${filePath}`);

            // run
            const { stdout, stderr } = await execPromise(`java -cp ${dir} ${className}`);
            if (stderr) return NextResponse.json({ success: false, error: stderr }, { status: 400 });
            return NextResponse.json({ success: true, output: stdout }, { status: 200 });

        } else {
            const uuid = uuidv4();
            const compiler = extensions[language];
            const filePath = path.join(dir, uuid + compiler.extension);
            fs.writeFileSync(filePath, CODE_TO_EXECUTE);

            if (language === "C" || language === "C++") {
                const outPath = `/data/${uuid}.out`;
                await execPromise(`${compiler.compiler} ${filePath} -o ${outPath}`);
                const { stdout, stderr } = await execPromise(outPath);
                if (stderr) return NextResponse.json({ success: false, error: stderr }, { status: 400 });
                return NextResponse.json({ success: true, output: stdout }, { status: 200 });
            } else { // Python
                const { stdout, stderr } = await execPromise(`${compiler.compiler} ${filePath}`);
                if (stderr) return NextResponse.json({ success: false, error: stderr }, { status: 400 });
                return NextResponse.json({ success: true, output: stdout }, { status: 200 });
            }
        }
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
