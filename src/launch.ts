import * as path from 'node:path';

export interface RunSettings {
    interpreterPath: string;
    interpreterArguments: string[];
    cliPath: string;
    workingDirectory: string;
    programArguments: string[];
}
/** Per-invocation capability; never loaded from workspace settings. */
export interface RunOptions { allowNative?: boolean }
export interface LaunchPlan { executable: string; args: string[]; cwd: string; cliPath?: string }

function stringValue(value: unknown, name: string): asserts value is string {
    if (typeof value !== 'string' || value.includes('\0') || /[\r\n]/.test(value)) {
        throw new Error(`${name} must be a string without NUL or line breaks.`);
    }
}
function stringArray(value: unknown, name: string): asserts value is string[] {
    if (!Array.isArray(value)) { throw new Error(`${name} must be an array of strings.`); }
    for (const item of value) { stringValue(item, name); }
}

/** Build argv, never a shell command. Only path settings expand our two documented variables. */
export function buildLaunchPlan(settings: RunSettings, file: string, workspace: string | undefined,
    platform: NodeJS.Platform = process.platform, options: RunOptions = {}): LaunchPlan {
    const paths = platform === 'win32' ? path.win32 : path.posix;
    stringValue(file, 'File path');
    if (!paths.isAbsolute(file)) { throw new Error('The source file must have an absolute path.'); }
    const fileDir = paths.dirname(file);
    const expand = (value: string, name: string): string => {
        stringValue(value, name);
        return value.replace(/\$\{([^}]+)\}/g, (_, variable: string) => {
            if (variable === 'fileDirname') { return fileDir; }
            if (variable === 'workspaceFolder' && workspace) { return workspace; }
            throw new Error(`Cannot resolve \${${variable}} in ${name}. Open a workspace folder or use an absolute path.`);
        });
    };
    stringValue(settings.interpreterPath, 'ru.interpreterPath');
    stringArray(settings.interpreterArguments, 'ru.interpreterArguments');
    stringArray(settings.programArguments, 'ru.programArguments');
    const interpreter = expand(settings.interpreterPath, 'ru.interpreterPath') || (platform === 'win32' ? 'python' : 'python3');
    // A plain name resolves via PATH. A relative path is explicit and anchored consistently.
    const executable = /[/\\]/.test(interpreter) && !paths.isAbsolute(interpreter)
        ? paths.resolve(workspace || fileDir, interpreter) : interpreter;
    if (/\.(?:cmd|bat)$/i.test(executable)) {
        throw new Error('Use a Python executable, not a .cmd/.bat shell wrapper, in ru.interpreterPath.');
    }
    const rawCli = expand(settings.cliPath, 'ru.cliPath');
    const cliPath = rawCli ? paths.resolve(workspace || fileDir, rawCli) : undefined;
    const cwd = paths.resolve(workspace || fileDir, expand(settings.workingDirectory, 'ru.workingDirectory') || fileDir);
    const args = [...settings.interpreterArguments, ...(cliPath ? [cliPath] : ['-m', 'rulang']),
        'run', ...(options.allowNative === true ? ['--allow-native'] : []), file, ...(settings.programArguments.length ? ['--', ...settings.programArguments] : [])];
    // VS Code resolves task variables even for ProcessExecution. Reject residual syntax
    // rather than let filenames or supposedly literal arguments invoke ${command:...}.
    if ([executable, ...args, cwd].some(value => value.includes('${'))) {
        throw new Error('Literal ${...} task-variable syntax is not supported in executable paths, filenames or arguments. Rename the file or remove that argument.');
    }
    return { executable, args, cwd, cliPath };
}
