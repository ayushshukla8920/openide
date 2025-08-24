const { createServer } = require('http');
const next = require('next');
const { Server } = require('socket.io');
const { spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const dev = false;
const hostname = 'localhost';
const port = 3000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
const extensions = {
    "c": { extension: ".c", compiler: "gcc" },
    "cpp": { extension: ".cpp", compiler: "g++" },
    "java": { extension: ".java", compiler: "javac" },
    "python": { extension: ".py", compiler: "python3" },
    "js": { extension: ".js", runner: "node" }
};
const EXECUTION_TIMEOUT = 500000;
app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        handler(req, res);
    });
    const io = new Server(httpServer);
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        let childProcess;
        const runProcess = (process) => {
            childProcess = process;
            const timeoutId = setTimeout(() => {
                childProcess.kill();
                socket.emit('output', { type: 'error', data: '\nError: Process timed out after 10 seconds.' });
            }, EXECUTION_TIMEOUT);
            childProcess.stdout.on('data', (data) => socket.emit('output', { type: 'success', data: data.toString() }));
            childProcess.stderr.on('data', (data) => socket.emit('output', { type: 'error', data: data.toString() }));
            childProcess.on('close', (code) => {
                clearTimeout(timeoutId);
                socket.emit('output', { type: 'info', data: `\nProcess exited with code ${code}` });
                childProcess = null;
            });
        };
        socket.on('run-code', async ({ code, lang, userId }) => {
            if (childProcess) childProcess.kill();
            const userDir = path.join(process.cwd(), "data", userId);
            await fs.mkdir(userDir, { recursive: true });
            if (lang === "js") {
                const filePath = path.join(userDir, `${uuidv4()}.js`);
                await fs.writeFile(filePath, code);
                runProcess(spawn('node', [filePath]));
                childProcess.on('close', () => fs.unlink(filePath).catch(err => console.error("Cleanup failed:", err)));
                return;
            }
            if (lang === "python") {
                const filePath = path.join(userDir, `${uuidv4()}.py`);
                await fs.writeFile(filePath, code);
                runProcess(spawn('python3', ['-u', filePath]));
                childProcess.on('close', () => fs.unlink(filePath).catch(err => console.error("Cleanup failed:", err)));
                return;
            }
            if (lang === "c" || lang === "cpp") {
                const uuid = uuidv4();
                const sourcePath = path.join(userDir, uuid + extensions[lang].extension);
                const outputPath = path.join(userDir, uuid + ".out");
                await fs.writeFile(sourcePath, code);
                const compiler = spawn(extensions[lang].compiler, [sourcePath, '-o', outputPath]);
                let compileError = '';
                compiler.stderr.on('data', (data) => { compileError += data.toString(); });
                compiler.on('close', async (code) => {
                    if (code !== 0) {
                        socket.emit('output', { type: 'error', data: compileError });
                        await fs.unlink(sourcePath);
                    } else {
                        runProcess(spawn('stdbuf', ['-o0', outputPath]));
                        childProcess.on('close', () => Promise.all([fs.unlink(sourcePath), fs.unlink(outputPath)]).catch(err => console.error("Cleanup failed:", err)));
                    }
                });
                return;
            }
            if (lang === "java") {
                const classNameMatch = code.match(/public\s+class\s+([a-zA-Z_]\w*)/);
                if (!classNameMatch) {
                    socket.emit('output', { type: 'error', data: "No public class found in Java code." });
                    return;
                }
                const className = classNameMatch[1];
                const tempDir = path.join(userDir, `exec_${uuidv4()}`);
                await fs.mkdir(tempDir, { recursive: true });
                const sourcePath = path.join(tempDir, `${className}.java`);
                await fs.writeFile(sourcePath, code);
                const compiler = spawn('javac', [sourcePath]);
                let compileError = '';
                compiler.stderr.on('data', (data) => { compileError += data.toString(); });
                compiler.on('close', async (code) => {
                    if (code !== 0) {
                        socket.emit('output', { type: 'error', data: compileError });
                    } else {
                        runProcess(spawn('java', ['-cp', tempDir, className]));
                    }
                    childProcess.on('close', () => fs.rm(tempDir, { recursive: true, force: true }).catch(err => console.error("Cleanup failed:", err)));
                });
                return;
            }
            socket.emit('output', { type: 'error', data: 'Unsupported language.' });
        });
        socket.on('terminal-input', (data) => {
            if (childProcess) {
                childProcess.stdin.write(data + '\n');
            }
        });
        socket.on('disconnect', () => {
            if (childProcess) childProcess.kill();
            console.log('Client disconnected:', socket.id);
        });
    });
    httpServer.listen(port, () => console.log(`> Ready on http://${hostname}:${port}`)).on('error', console.error);
});