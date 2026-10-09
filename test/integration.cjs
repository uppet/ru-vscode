const vscode = require('vscode');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const delay = ms => new Promise(r => setTimeout(r, ms));
async function until(predicate, label) {
    for (let attempt = 0; attempt < 200; attempt++) { if (await predicate()) return; await delay(100); }
    throw new Error(`Timed out: ${label}`);
}
exports.run = async () => {
    const root = process.env.RU_TEST_WORKSPACE;
    const file = path.join(root, '空 格;测试.ru');
    const helper = path.join(root, '假 CLI.py');
    const report = path.join(root, 'report.json');
    await fs.writeFile(file, "显 '你好'.\n");
    await fs.writeFile(helper, `import json, os, sys\nline = sys.stdin.readline()\nwith open(${JSON.stringify(report)}, 'w', encoding='utf-8') as f:\n    json.dump({'argv':sys.argv[1:], 'cwd':os.getcwd(), 'stdin':line},f,ensure_ascii=False)\nprint('RUN_OK', flush=True)\nsys.exit(7)\n`);
    const config = vscode.workspace.getConfiguration('ru');
    for (const [k, v] of Object.entries({ interpreterPath: process.platform === 'win32' ? 'python' : 'python3', cliPath: helper, programArguments: ['a b', '你好', '$(no shell)'] })) {
        await config.update(k, v, vscode.ConfigurationTarget.Workspace);
    }
    const document = await vscode.workspace.openTextDocument(file);
    assert.equal(document.languageId, 'ru', '.ru association');
    await vscode.window.showTextDocument(document);
    const extension = vscode.extensions.getExtension('uppet.ru-vscode');
    assert.ok(extension); await extension.activate();
    assert.ok((await vscode.commands.getCommands()).includes('ru.runFile'));
    const helpDocument = await vscode.workspace.openTextDocument({ language: 'ru', content: '值 取 1.\n显 值.' });
    const editor = await vscode.window.showTextDocument(helpDocument);
    const hovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', helpDocument.uri, new vscode.Position(0, 2));
    assert.ok(hovers.some(h => h.contents.some(c => c.value?.includes('非模块'))), 'registered lexical hover');
    editor.selection = new vscode.Selection(0, 0, 0, 0);
    await vscode.commands.executeCommand('editor.action.commentLine');
    assert.match(helpDocument.getText(), /^批\./);
    await vscode.commands.executeCommand('editor.action.commentLine');
    assert.equal(helpDocument.getText(), '值 取 1.\n显 值.');
    editor.selection = new vscode.Selection(0, 0, 1, 4);
    await vscode.commands.executeCommand('editor.action.blockComment');
    assert.ok(helpDocument.getText().includes('解.') && helpDocument.getText().includes('释.'));
    await vscode.commands.executeCommand('editor.action.blockComment');
    assert.equal(helpDocument.getText(), '值 取 1.\n显 值.');
    const finishDocument = await vscode.workspace.openTextDocument({ language: 'ru', content: '作 处理:\n    完。\n为\n批. 完.\n完成 取 1.' });
    await vscode.window.showTextDocument(finishDocument);
    const finishHovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', finishDocument.uri, new vscode.Position(1, 4));
    assert.ok(finishHovers.some(h => h.contents.some(c => c.value?.includes('返回空'))), 'registered procedure finish hover');
    for (const position of [new vscode.Position(3, 3), new vscode.Position(4, 0)]) {
        const hidden = await vscode.commands.executeCommand('vscode.executeHoverProvider', finishDocument.uri, position);
        assert.ok(!hidden.some(h => h.contents.some(c => c.value?.includes('完：'))), 'no finish hover in comments or larger identifiers');
    }
    await vscode.window.showTextDocument(document);
    const starts = [], ends = [];
    const listeners = [vscode.tasks.onDidStartTaskProcess(e => starts.push(e)), vscode.tasks.onDidEndTaskProcess(e => ends.push(e))];
    try {
        await vscode.commands.executeCommand('ru.runFile');
        await until(() => starts.length === 1, 'process start');
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('ru.runFile');
        assert.equal(starts.length, 1, 'no duplicate while running');
        await until(() => vscode.window.activeTerminal, 'interactive terminal');
        vscode.window.activeTerminal.sendText('终端输入 hello');
        await until(() => ends.length === 1, 'process exit');
        assert.equal(ends[0].exitCode, 7);
        const result = JSON.parse(await fs.readFile(report, 'utf8'));
        assert.deepEqual(result.argv, ['run', file, '--', 'a b', '你好', '$(no shell)']);
        assert.equal(result.cwd, root);
        assert.equal(result.stdin.trim(), '终端输入 hello');
        await until(() => vscode.tasks.taskExecutions.length === 0, 'task cleanup');
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('ru.runFile');
        await until(() => starts.length === 2, 'repeat after exit');
        vscode.window.activeTerminal.sendText('second');
        await until(() => ends.length === 2, 'second exit');
        console.log('PASS: real extension activation, association, process argv/cwd, terminal stdin, exit status, duplicate guard, and rerun.');
    } finally { listeners.forEach(x => x.dispose()); }
};
