import * as vscode from 'vscode';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { hoverAt } from './hover';
import { buildLaunchPlan, RunSettings } from './launch';

/** No subprocess is created during activation or while editing. */
export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(vscode.languages.registerHoverProvider('ru', {
        provideHover(document, position) {
            const result = hoverAt(document.getText(), document.offsetAt(position));
            if (!result) { return undefined; }
            return new vscode.Hover(result.text, new vscode.Range(document.positionAt(result.start), document.positionAt(result.end)));
        }
    }));
    // Both commands share reservations, including the time spent awaiting consent/save.
    const fileKey = (file: string) => process.platform === 'win32' ? path.normalize(file).toLowerCase() : file;
    const pending = new Set<string>();
    const running = new Map<string, vscode.Task>();
    context.subscriptions.push(vscode.tasks.onDidEndTask(event => {
        const { type, file } = event.execution.task.definition;
        if (type === 'ru') { running.delete(file); }
    }));
    const runFile = async (allowNative: boolean): Promise<void> => {
        let document = vscode.window.activeTextEditor?.document;
        if (!vscode.workspace.isTrusted) {
            void vscode.window.showWarningMessage('如言: 请先信任此工作区，再运行代码。');
            return;
        }
        if (!document || document.languageId !== 'ru') {
            void vscode.window.showInformationMessage('如言: 请先打开一个 .ru 文件。');
            return;
        }
        if (allowNative && (document.isUntitled || document.uri.scheme !== 'file')) {
            void vscode.window.showInformationMessage('如言: 请先在编辑器中保存为有名称的 .ru 文件，再选择原生运行；本次不会保存或运行。');
            return;
        }
        const originalKey = document.uri.scheme === 'file' ? fileKey(document.uri.fsPath) : document.uri.toString();
        if (pending.has(originalKey)) { return; }
        pending.add(originalKey);
        let startedKey: string | undefined;
        let startedTask: vscode.Task | undefined;
        try {
            // Consent belongs to one named document and one content version. Never follow a
            // changed editor, Save As target or save participant to different code.
            const approvedDocument = document;
            const approvedUri = document.uri.toString();
            const approvedVersion = document.version;
            const approvedText = allowNative ? document.getText() : undefined;
            const assertNativeTarget = () => {
                if (!allowNative) { return; }
                if (!vscode.workspace.isTrusted) { throw new Error('工作区已不再受信任，取消原生运行。'); }
                if (vscode.window.activeTextEditor?.document !== approvedDocument || document !== approvedDocument
                    || document.uri.toString() !== approvedUri || document.version !== approvedVersion
                    || document.getText() !== approvedText || document.isClosed || document.isUntitled
                    || document.uri.scheme !== 'file' || document.languageId !== 'ru') {
                    throw new Error('确认的文件、内容版本或当前编辑器已变化，请重新选择原生运行并确认。');
                }
            };
            if (allowNative) {
                const existing = vscode.tasks.taskExecutions.some(execution => execution.task.definition.type === 'ru'
                    && execution.task.definition.file === originalKey);
                if (running.has(originalKey) || existing) {
                    void vscode.window.showInformationMessage('如言: 此文件仍在运行。请先终止任务，再重新运行。');
                    return;
                }
                const mustSave = document.isDirty;
                const action = mustSave ? '保存并允许原生运行一次' : '允许原生运行一次';
                const choice = await vscode.window.showWarningMessage('如言: 允许此文件运行原生代码？', {
                    modal: true,
                    detail: `文件：${document.uri.fsPath}\n\n原生代码将通过当前配置的解释器，以当前账户权限运行，可读写文件、访问网络或调用操作系统；错误可能导致进程崩溃。此授权不是安全沙箱，也不限制导入模块或动态库。仅允许本次运行，不会保存长期授权。\n\n如:密／如见目前仅支持本地 Windows x64 Python；支持情况由配置的解释器判断。`
                }, action);
                if (choice !== action) { return; }
                assertNativeTarget();
                if (mustSave && !(await document.save())) { return; }
                assertNativeTarget();
            } else if (document.isUntitled || document.isDirty) {
                const wasUntitled = document.isUntitled;
                const originalText = wasUntitled ? document.getText() : undefined;
                const choice = await vscode.window.showWarningMessage('如言: 保存当前文件后运行？',
                    { modal: true }, '保存并运行');
                if (choice !== '保存并运行' || !(await document.save())) { return; }
                // Save As replaces an untitled TextDocument; its old URI does not become a file URI.
                if (wasUntitled) {
                    const saved = vscode.window.activeTextEditor?.document;
                    if (!saved || saved.isUntitled || saved.languageId !== 'ru' || saved.getText() !== originalText) {
                        throw new Error('新文件已保存。请切回保存后的 .ru 文件，再次运行。');
                    }
                    document = saved;
                }
            }
            if (document.isUntitled || document.isDirty || document.uri.scheme !== 'file') {
                throw new Error('请将文件保存到当前扩展宿主的磁盘；不支持运行虚拟文档。');
            }
            const file = document.uri.fsPath;
            const key = fileKey(file);
            const existing = vscode.tasks.taskExecutions.some(execution => execution.task.definition.type === 'ru'
                && execution.task.definition.file === key);
            if (running.has(key) || existing) {
                void vscode.window.showInformationMessage('如言: 此文件仍在运行。请在任务终端输入、按 Ctrl+C 或终止任务，再重新运行。');
                return;
            }
            const folder = vscode.workspace.getWorkspaceFolder(document.uri);
            const config = vscode.workspace.getConfiguration('ru', document.uri);
            const settings: RunSettings = {
                interpreterPath: config.get('interpreterPath', ''),
                interpreterArguments: config.get('interpreterArguments', ['-u']),
                cliPath: config.get('cliPath', ''),
                workingDirectory: config.get('workingDirectory', '${fileDirname}'),
                programArguments: config.get('programArguments', [])
            };
            const plan = buildLaunchPlan(settings, file, folder?.uri.fsPath, process.platform, { allowNative });
            if (!(await fs.stat(plan.cwd)).isDirectory()) { throw new Error('ru.workingDirectory 不是目录。'); }
            if (plan.cliPath && !(await fs.stat(plan.cliPath)).isFile()) { throw new Error('ru.cliPath 不是文件。'); }
            if (!vscode.workspace.isTrusted) { throw new Error('工作区已不再受信任，取消运行。'); }
            if (document.isDirty || document.isClosed) { throw new Error('文件在准备运行时被修改或关闭，请保存后重新运行。'); }
            assertNativeTarget();
            // Recheck after filesystem awaits: another invocation may have started this file.
            if (running.has(key) || vscode.tasks.taskExecutions.some(execution => execution.task.definition.type === 'ru'
                && execution.task.definition.file === key)) { return; }
            const task = new vscode.Task({ type: 'ru', file: key }, folder ?? vscode.TaskScope.Global,
                `${allowNative ? '原生运行' : '运行'} ${path.basename(file)}`, '如言', new vscode.ProcessExecution(plan.executable, plan.args, { cwd: plan.cwd }), ['$ru']);
            task.presentationOptions = { reveal: vscode.TaskRevealKind.Always, focus: true,
                panel: vscode.TaskPanelKind.Dedicated, clear: true, showReuseMessage: false };
            startedKey = key;
            startedTask = task;
            running.set(key, task);
            await vscode.tasks.executeTask(task);
        } catch (error) {
            if (startedKey && running.get(startedKey) === startedTask) { running.delete(startedKey); }
            const message = error instanceof Error ? error.message : String(error);
            void vscode.window.showErrorMessage(`如言: 无法运行当前文件。${message} 检查 ru.interpreterPath、ru.cliPath 和工作目录设置。`);
        } finally {
            pending.delete(originalKey);
        }
    };
    context.subscriptions.push(
        vscode.commands.registerCommand('ru.runFile', () => runFile(false)),
        vscode.commands.registerCommand('ru.runFileNative', () => runFile(true))
    );
}
