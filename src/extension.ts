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
    const pending = new Set<string>();
    const running = new Map<string, vscode.Task>();
    context.subscriptions.push(vscode.tasks.onDidEndTask(event => {
        const { type, file } = event.execution.task.definition;
        if (type === 'ru') { running.delete(file); }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('ru.runFile', async () => {
        let document = vscode.window.activeTextEditor?.document;
        if (!vscode.workspace.isTrusted) {
            void vscode.window.showWarningMessage('如言: 请先信任此工作区，再运行代码。');
            return;
        }
        if (!document || document.languageId !== 'ru') {
            void vscode.window.showInformationMessage('如言: 请先打开一个 .ru 文件。');
            return;
        }
        const originalKey = document.uri.toString();
        if (pending.has(originalKey)) { return; }
        pending.add(originalKey);
        let startedKey: string | undefined;
        let startedTask: vscode.Task | undefined;
        try {
            if (document.isUntitled || document.isDirty) {
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
            const key = process.platform === 'win32' ? path.normalize(file).toLowerCase() : file;
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
            const plan = buildLaunchPlan(settings, file, folder?.uri.fsPath);
            if (!(await fs.stat(plan.cwd)).isDirectory()) { throw new Error('ru.workingDirectory 不是目录。'); }
            if (plan.cliPath && !(await fs.stat(plan.cliPath)).isFile()) { throw new Error('ru.cliPath 不是文件。'); }
            if (!vscode.workspace.isTrusted) { throw new Error('工作区已不再受信任，取消运行。'); }
            if (document.isDirty || document.isClosed) { throw new Error('文件在准备运行时被修改或关闭，请保存后重新运行。'); }
            // Recheck after filesystem awaits: another invocation may have started this file.
            if (running.has(key)) { return; }
            const task = new vscode.Task({ type: 'ru', file: key }, folder ?? vscode.TaskScope.Global,
                `运行 ${path.basename(file)}`, '如言', new vscode.ProcessExecution(plan.executable, plan.args, { cwd: plan.cwd }), ['$ru']);
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
    }));
}
