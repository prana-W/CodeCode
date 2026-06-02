import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execFileAsync = promisify(execFile);

const DOCKER_IMAGES = {
    cpp: 'gcc:latest',
    c: 'gcc:latest',
    java: 'openjdk:21-slim',
    python: 'python:3.12-slim',
    javascript: 'node:22-slim',
};

const SOURCE_FILE_NAMES = {
    cpp: 'main.cpp',
    c: 'main.c',
    java: 'Main.java',
    python: 'main.py',
    javascript: 'main.js',
};

function buildRunScript(language, timeoutSecs) {
    const compileSteps = {
        cpp: `g++ /code/main.cpp -o /code/main 2>/code/compile.err\nif [ $? -ne 0 ]; then exit 100; fi\n`,
        c: `gcc /code/main.c -o /code/main 2>/code/compile.err\nif [ $? -ne 0 ]; then exit 100; fi\n`,
        java: `javac /code/Main.java 2>/code/compile.err\nif [ $? -ne 0 ]; then exit 100; fi\n`,
        python: '',
        javascript: '',
    };

    const runCommands = {
        cpp: `timeout ${timeoutSecs} /code/main`,
        c: `timeout ${timeoutSecs} /code/main`,
        java: `timeout ${timeoutSecs} java -cp /code Main`,
        python: `timeout ${timeoutSecs} python3 /code/main.py`,
        javascript: `timeout ${timeoutSecs} node /code/main.js`,
    };

    return `#!/bin/sh\n${compileSteps[language]}${runCommands[language]}\nexit $?`;
}

export async function runJudge({
    source_code,
    language,
    input_data,
    expected_output,
    time_limit_ms,
    memory_limit_mb,
}) {
    const timeoutSecs = Math.ceil(time_limit_ms / 1000);
    const memStr = `${memory_limit_mb}m`;

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'judge_'));

    console.log(source_code);
    console.log(input_data);
    

    try {
        await fs.writeFile(path.join(tmpDir, SOURCE_FILE_NAMES[language]), source_code, 'utf8');
        await fs.writeFile(path.join(tmpDir, 'run.sh'), buildRunScript(language, timeoutSecs), {
            encoding: 'utf8',
            mode: 0o755,
        });

        let stdout = '';
        let exitCode = 0;
        let killed = false;

        const start = Date.now();

        try {
            const result = await execFileAsync(
                'docker',
                [
                    'run',
                    '--name', 
                    `judge-${Date.now()}`,
                    '--network=none',
                    `--memory=${memStr}`,
                    '--memory-swap', memStr,
                    '--cpus=1',
                    '-v', `${tmpDir}:/code`,
                    '-i',
                    DOCKER_IMAGES[language],
                    'sh', '/code/run.sh'
                    
                ],
                {
                    input: input_data ?? '',
                    timeout: time_limit_ms + 10_000,
                    maxBuffer: 10 * 1024 * 1024,
                }
            );
            stdout = result.stdout;
        } catch (err) {
            exitCode = typeof err.code === 'number' ? err.code : 1;
            stdout = err.stdout ?? '';
            killed = !!err.killed;
        }

        const elapsed = Date.now() - start;

        let verdict;

        if (killed || exitCode === 124) {
            verdict = 'time_limit_exceeded';
        } else if (exitCode === 137) {
            verdict = 'memory_limit_exceeded';
        } else if (exitCode === 100) {
            verdict = 'compilation_error';
        } else if (exitCode !== 0) {
            verdict = 'runtime_error';
        } else {
            verdict = stdout.trim() === expected_output.trim() ? 'accepted' : 'wrong_answer';
        }

        return { verdict, execution_time_ms: elapsed };
    } finally {
        // await fs.rm(tmpDir, { recursive: true, force: true });
    }
}
