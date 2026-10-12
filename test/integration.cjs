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
    await fs.writeFile(helper, `import json, os, sys\nprint(f'{sys.argv[2]}:1:3: error: 运行错误：测试定位', file=sys.stderr, flush=True)\nline = sys.stdin.readline()\nwith open(${JSON.stringify(report)}, 'w', encoding='utf-8') as f:\n    json.dump({'argv':sys.argv[1:], 'cwd':os.getcwd(), 'stdin':line},f,ensure_ascii=False)\nprint('RUN_OK', flush=True)\nsys.exit(7)\n`);
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
    const optionalDocument = await vscode.workspace.openTextDocument({ language: 'ru', content: '算 原样 值:\n    得 值.\n法\n作 显示 值:\n    显 值.\n为' });
    for (const line of [0, 3]) {
        const optionalHovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', optionalDocument.uri, new vscode.Position(line, 0));
        assert.ok(optionalHovers.some(h => h.contents.some(c => c.value?.includes('0.9.0') && c.value?.includes('含空'))), 'registered RU008 declaration hover');
    }
    const factsDocument = await vscode.workspace.openTextDocument({ language: 'ru', content: '事实 真 假 典 成\n完成 取 真.\n批. 典 成 假' });
    for (const column of [0, 3, 5, 7, 9]) {
        const found = await vscode.commands.executeCommand('vscode.executeHoverProvider', factsDocument.uri, new vscode.Position(0,column));
        assert.ok(found.some(h => h.contents.some(c => c.value?.includes('0.10.0'))), 'registered fact/map hover');
    }
    const completed = await vscode.commands.executeCommand('vscode.executeHoverProvider', factsDocument.uri, new vscode.Position(1,1));
    assert.ok(!completed.some(h => h.contents.some(c => c.value?.includes('成：'))), '完成 never exposes 成 hover');
    const mapDocument = await vscode.workspace.openTextDocument({ language: 'ru', content: '表 取 典:成.' });
    const mapEditor = await vscode.window.showTextDocument(mapDocument);
    mapEditor.options = { insertSpaces: true, tabSize: 4 };
    mapEditor.selection = new vscode.Selection(0,6,0,6);
    await vscode.commands.executeCommand('type', { text: '\n' });
    assert.equal(mapDocument.getText(), '表 取 典:\n    \n成.', 'paired map Enter indentation');
    const snippetDocument = await vscode.workspace.openTextDocument({ language: 'ru', content: '' });
    const snippetEditor = await vscode.window.showTextDocument(snippetDocument);
    const mapSnippet = require('../snippets/ru.json')['典字面量'];
    await snippetEditor.insertSnippet(new vscode.SnippetString(mapSnippet.body.join('\n')));
    assert.equal(snippetDocument.getText(), '典:\n    ‘上’ 对 0.\n    ‘下’ 对 2.\n成');
    for (const [open, close] of [['{','}'], ['｛','｝']]) {
        const doc = await vscode.workspace.openTextDocument({ language: 'ru', content: '表 取 ' });
        const ed = await vscode.window.showTextDocument(doc);
        ed.options = { insertSpaces: true, tabSize: 4 };
        ed.selection = new vscode.Selection(0,4,0,4);
        await vscode.commands.executeCommand('type', { text: open });
        assert.equal(doc.getText(), `表 取 ${open}${close}`, 'symbol auto closing');
        await vscode.commands.executeCommand('type', { text: '\n' });
        assert.equal(doc.getText(), `表 取 ${open}\n    \n${close}`, 'symbol paired Enter');
    }
    const symbolDoc = await vscode.workspace.openTextDocument({ language: 'ru', content: '' });
    const symbolEditor = await vscode.window.showTextDocument(symbolDoc);
    symbolEditor.options = { insertSpaces: true, tabSize: 4 };
    await symbolEditor.insertSnippet(new vscode.SnippetString(require('../snippets/ru.json')['符号典'].body.join('\n')));
    assert.equal(symbolDoc.getText(), "{\n    '心': 0,\n    '意': 1\n}", 'symbol snippet');
    const scopeDoc = await vscode.workspace.openTextDocument({ language: 'ru', content: '段:落.' });
    const scopeEditor = await vscode.window.showTextDocument(scopeDoc);
    scopeEditor.options = { insertSpaces: true, tabSize: 4 };
    scopeEditor.selection = new vscode.Selection(0,2,0,2);
    await vscode.commands.executeCommand('type', { text: '\n' });
    assert.equal(scopeDoc.getText(), '段:\n    \n落.', 'scope paired Enter');
    const scopeHovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', scopeDoc.uri, new vscode.Position(0,0));
    assert.ok(scopeHovers.some(h=>h.contents.some(c=>c.value?.includes('直接取只写当前块'))), 'scope hover registered');
    for (const [name, expected] of [['作用域段','段:\n    值 取 1.\n    显 值.\n落.\n'], ['符号作用域块','{\n    值 取 1.\n    显 值.\n}\n'], ['符号赋值','值 := 1.\n']]) {
        const doc = await vscode.workspace.openTextDocument({language:'ru',content:''});
        const ed = await vscode.window.showTextDocument(doc);
        ed.options = {insertSpaces:true,tabSize:4};
        await ed.insertSnippet(new vscode.SnippetString(require('../snippets/ru.json')[name].body.join('\n')));
        assert.equal(doc.getText(),expected,name);
    }
    const aliasDoc = await vscode.workspace.openTextDocument({language:'ru',content:'值 := 1.\n其 段 始:0.\n批. 段:'});
    const aliasHovers = await vscode.commands.executeCommand('vscode.executeHoverProvider',aliasDoc.uri,new vscode.Position(0,2));
    assert.ok(aliasHovers.some(h=>h.contents.some(c=>c.value?.includes('不是赋值表达式'))), 'alias hover registered');
    for(const pos of [new vscode.Position(1,2),new vscode.Position(2,3)]) {
        const hidden = await vscode.commands.executeCommand('vscode.executeHoverProvider',aliasDoc.uri,pos);
        assert.ok(!hidden.some(h=>h.contents.some(c=>c.value?.includes('段：'))),'no member/comment scope hover');
    }
    const practicalDoc = await vscode.workspace.openTextDocument({language:'ru',content:'列 其 删 位:1.\n列 其 弹.\n列 其 查 值:1.\n删 取 1.\n批. 其 弹.'});
    for (const line of [0,1,2]) {
        const found=await vscode.commands.executeCommand('vscode.executeHoverProvider',practicalDoc.uri,new vscode.Position(line,4));
        assert.ok(found.some(h=>h.contents.some(c=>c.value?.includes('0.12.0'))),'practical member hover');
    }
    const lookupHelp = await vscode.commands.executeCommand('vscode.executeHoverProvider', practicalDoc.uri, new vscode.Position(2,4));
    assert.ok(lookupHelp.some(h => h.contents.some(c => c.value?.includes('典 其 查 目:目标.') && c.value.includes('阵 其 查 值:目标.'))), 'dictionary and array named parameters differ');
    for (const [line,col] of [[3,0],[4,6]]) {
        const hidden=await vscode.commands.executeCommand('vscode.executeHoverProvider',practicalDoc.uri,new vscode.Position(line,col));
        assert.equal(hidden.length,0,'ordinary name/comment has no practical hover');
    }
    for (const name of ['文本整理','数学计算','随机种子','阵删弹查','典命名参数','如观绘图','如观动画交互']) {
        const doc=await vscode.workspace.openTextDocument({language:'ru',content:''});
        const ed=await vscode.window.showTextDocument(doc);
        const body=require('../snippets/ru.json')[name].body.join('\n');
        await ed.insertSnippet(new vscode.SnippetString(body));
        assert.equal(doc.getText(),body.replace('$0',''),name);
    }
    await vscode.window.showTextDocument(document);
    const starts = [], ends = [];
    const listeners = [vscode.tasks.onDidStartTaskProcess(e => starts.push(e)), vscode.tasks.onDidEndTaskProcess(e => ends.push(e))];
    try {
        await vscode.commands.executeCommand('ru.runFile');
        await until(() => starts.length === 1, 'process start');
        await until(() => vscode.languages.getDiagnostics(document.uri).some(d => d.message.includes('测试定位')), 'stderr diagnostic');
        const diagnostic = vscode.languages.getDiagnostics(document.uri).find(d => d.message.includes('测试定位'));
        assert.equal(diagnostic.range.start.line, 0, 'one-based text line becomes zero-based API line');
        assert.equal(diagnostic.range.start.character, 0, 'line navigation intentionally ignores codepoint column');
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
