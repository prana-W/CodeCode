import {execFile} from 'child_process';
import {promisify} from 'util';
import fs from 'fs/promises';
import path from 'path';

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
        cpp: `
g++ /code/main.cpp -o /code/main 2>/code/compile.err
if [ $? -ne 0 ]; then
    exit 100
fi
`,
        c: `
gcc /code/main.c -o /code/main 2>/code/compile.err
if [ $? -ne 0 ]; then
    exit 100
fi
`,
        java: `
javac /code/Main.java 2>/code/compile.err
if [ $? -ne 0 ]; then
    exit 100
fi
`,
        python: '',
        javascript: '',
    };

    const runCommands = {
        cpp: `timeout ${timeoutSecs} /code/main < /code/input.txt`,
        c: `timeout ${timeoutSecs} /code/main < /code/input.txt`,
        java: `timeout ${timeoutSecs} java -cp /code Main < /code/input.txt`,
        python: `timeout ${timeoutSecs} python3 /code/main.py < /code/input.txt`,
        javascript: `timeout ${timeoutSecs} node /code/main.js < /code/input.txt`,
    };

    return `#!/bin/sh
${compileSteps[language]}
${runCommands[language]}
exit $?
`;
}

function normalizeOutput(text) {
    return text.replace(/\r\n/g, '\n').trim();
}

export async function runJudge({
    submission_id,
    source_code,
    language,
    input_data,
    expected_output,
    time_limit_ms,
    memory_limit_mb,
}) {
    const timeoutSecs = Math.ceil(time_limit_ms / 1000);
    const memStr = `${memory_limit_mb}m`;

    const sandboxRoot = path.join(process.cwd(), 'sandbox');

    await fs.mkdir(sandboxRoot, {recursive: true});

    const sandboxPath = path.join(sandboxRoot, `submission-${submission_id}`);

    await fs.mkdir(sandboxPath, {recursive: true});

    try {
        await fs.writeFile(
            path.join(sandboxPath, SOURCE_FILE_NAMES[language]),
            source_code,
            'utf8'
        );

        await fs.writeFile(
            path.join(sandboxPath, 'input.txt'),
            input_data ?? '',
            'utf8'
        );

        await fs.writeFile(
            path.join(sandboxPath, 'run.sh'),
            buildRunScript(language, timeoutSecs),
            {
                encoding: 'utf8',
                mode: 0o755,
            }
        );

        let stdout = '';
        let exitCode = 0;
        let killed = false;

        const start = Date.now();

        try {
            const result = await execFileAsync(
                'docker',
                [
                    'run',
                    '--rm',

                    '--name',
                    `judge-${submission_id}`,

                    '--network=none',

                    `--memory=${memStr}`,
                    '--memory-swap',
                    memStr,

                    '--cpus=1',

                    '-v',
                    `${path.resolve(sandboxPath)}:/code`,

                    DOCKER_IMAGES[language],

                    'sh',
                    '/code/run.sh',
                ],
                {
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
            verdict =
                normalizeOutput(stdout) === normalizeOutput(expected_output)
                    ? 'accepted'
                    : 'wrong_answer';
        }

        let compilationError = '';

        try {
            compilationError = await fs.readFile(
                path.join(sandboxPath, 'compile.err'),
                'utf8'
            );
        } catch {
            // ignore
        }

        return {
            verdict,
            execution_time_ms: elapsed,
            compilation_error: compilationError,
            actual_output: stdout,
        };
    } finally {
        // Enable after testing
        await fs.rm(sandboxPath, {
            recursive: true,
            force: true,
        });
    }
}
