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
    async function writeHelper(message, exitCode) {
        // Emit stderr before reading stdin to cover a real interactive task.
        const diagnostic = message ? `print(f'{sys.argv[2]}:1:3: error: ' + ${JSON.stringify(message)}, file=sys.stderr, flush=True)\n` : '';
        await fs.writeFile(helper, `import json, os, sys\n${diagnostic}line = sys.stdin.readline()\nwith open(${JSON.stringify(report)}, 'w', encoding='utf-8') as f:\n    json.dump({'argv':sys.argv[1:], 'cwd':os.getcwd(), 'stdin':line},f,ensure_ascii=False)\nprint('RUN_OK', flush=True)\nsys.exit(${exitCode})\n`);
    }
    await writeHelper('运行错误：测试定位', 7);
    const config = vscode.workspace.getConfiguration('ru');
    for (const [k, v] of Object.entries({ interpreterPath: process.platform === 'win32' ? 'python' : 'python3', cliPath: helper, programArguments: ['a b', '你好', '$(no shell)'] })) {
        await config.update(k, v, vscode.ConfigurationTarget.Workspace);
    }
    const document = await vscode.workspace.openTextDocument(file);
    assert.equal(document.languageId, 'ru', '.ru association');
    await vscode.window.showTextDocument(document);
    const extension = vscode.extensions.getExtension('uppet.ru-vscode');
    assert.ok(extension); await extension.activate();
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('ru.runFile'));
    assert.ok(commands.includes('ru.runFileNative'));
    const continueDoc = await vscode.workspace.openTextDocument({language:'ru',content:'循 2 次\n续.\n环.\n继续 取 1.\n# 续.'});
    const continueHovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', continueDoc.uri, new vscode.Position(1,0));
    assert.ok(continueHovers.some(h => h.contents.some(c => c.value?.includes('计次循环正常推进') && c.value.includes('不能跨函数或回调'))), 'continue hover registered');
    for (const position of [new vscode.Position(3,1),new vscode.Position(4,2)]) {
        const hidden = await vscode.commands.executeCommand('vscode.executeHoverProvider',continueDoc.uri,position);
        assert.ok(!hidden.some(h=>h.contents.some(c=>c.value?.includes('续：'))),'continue hover hides longer names and comments');
    }
    const continueSnippetDoc = await vscode.workspace.openTextDocument({language:'ru',content:'循 2 次\n    '});
    const continueEditor = await vscode.window.showTextDocument(continueSnippetDoc);
    continueEditor.selection = new vscode.Selection(1,4,1,4);
    await vscode.commands.executeCommand('editor.action.insertSnippet',{langId:'ru',name:'继续下一轮循环'});
    assert.ok(continueSnippetDoc.getText().includes('    续.'),'continue snippet uses statement period');
    const elifDoc = await vscode.workspace.openTextDocument({language:'ru',content:'若 假 则\n显 1.\n另若 真 则\n显 2.\n然.'});
    const elifHover = await vscode.commands.executeCommand('vscode.executeHoverProvider', elifDoc.uri, new vscode.Position(2,1));
    assert.ok(elifHover.some(h => h.contents.some(c => c.value?.includes('0.23.0') && c.value.includes('一个然'))), 'else-if hover registered');
    const elifSnippetDoc = await vscode.workspace.openTextDocument({language:'ru',content:''});
    const elifEditor = await vscode.window.showTextDocument(elifSnippetDoc);
    await elifEditor.insertSnippet(new vscode.SnippetString(require('../snippets/ru.json')['多分支条件'].body.join('\n')));
    assert.ok(elifSnippetDoc.getText().includes('另若 真 则'), 'else-if snippet inserts sibling branch');
    assert.equal(elifSnippetDoc.getText().split('然.').length-1,1,'else-if snippet has one closer');
    const packageSource='吾 解. declaration 释. 言 工程 其 𠀀模块。\n力 取 外言 物理 其 排序.\n吾 取 1. 言 取 2.\n算 f: 吾 言 工程. 法.\n试: 卒 ‘失败’. 救 原因: 显 原因. 终. 吾 言 工程.';
    const packageDoc=await vscode.workspace.openTextDocument({language:'ru',content:packageSource});
    for(const [line,col] of [[0,0],[0,20],[1,12]]) {
        const found=await vscode.commands.executeCommand('vscode.executeHoverProvider',packageDoc.uri,new vscode.Position(line,col));
        assert.ok(found.some(h=>h.contents.some(c=>c.value?.includes('0.22.0'))),'package hover registered');
    }
    for(const [line,col] of [[2,0],[2,7],[3,5]]) {
        const found=await vscode.commands.executeCommand('vscode.executeHoverProvider',packageDoc.uri,new vscode.Position(line,col));
        assert.ok(!found.some(h=>h.contents.some(c=>c.value?.includes('模块声明'))),'ordinary or nested declaration name is not a keyword');
    }
    const afterTry=await vscode.commands.executeCommand('vscode.executeHoverProvider',packageDoc.uri,packageDoc.positionAt(packageSource.lastIndexOf('吾')));
    assert.ok(afterTry.some(h=>h.contents.some(c=>c.value?.includes('模块声明'))),'module declaration after try/rescue is highlighted and explained');
    const semantic=await vscode.commands.executeCommand('vscode.provideDocumentSemanticTokens',packageDoc.uri);
    const legend=await vscode.commands.executeCommand('vscode.provideDocumentSemanticTokensLegend',packageDoc.uri);
    assert.deepEqual(legend.tokenTypes,['keyword','namespace']);
    assert.equal(semantic.data.length,12*5,'complete declarations including after try/rescue and named import semantic tokens');
    const manifestFile=path.join(root,'集录.ru');
    await fs.writeFile(manifestFile,"典: '名' 对 '工程'. '公开' 对 ['力学']. 成.\n");
    const manifestDoc=await vscode.workspace.openTextDocument(manifestFile);
    const manifestHover=await vscode.commands.executeCommand('vscode.executeHoverProvider',manifestDoc.uri,new vscode.Position(0,5));
    assert.ok(manifestHover.some(h=>h.contents.some(c=>c.value?.includes('静态包清单'))));
    for(const name of ['具名模块声明','具名模块导入','具名全量导入','静态包清单']) {
        const doc=await vscode.workspace.openTextDocument({language:'ru',content:''});
        const editor=await vscode.window.showTextDocument(doc); editor.options={insertSpaces:true,tabSize:4};
        const body=require('../snippets/ru.json')[name].body.join('\n');
        await editor.insertSnippet(new vscode.SnippetString(body));
        const expected=body.replace(/\$\{\d+:([^}]*)\}/g,'$1').replace('$0','').replaceAll('\t','    ');
        assert.equal(doc.getText(),expected,name);
    }
    const nativeHelp = await vscode.workspace.openTextDocument({ language: 'ru', content: "密 取 外言 '如:密'.\n见 取 外言 '如见'.\nu64 取 1." });
    for (const line of [0, 1]) {
        const hovers = await vscode.commands.executeCommand('vscode.executeHoverProvider', nativeHelp.uri, new vscode.Position(line, 8));
        assert.ok(hovers.some(h => h.contents.some(c => c.value?.includes('Windows x64') && c.value.includes('--allow-native'))), 'native import help registered');
    }
    assert.equal((await vscode.commands.executeCommand('vscode.executeHoverProvider', nativeHelp.uri, new vscode.Position(2, 0))).length, 0);
    for (const name of ['原生机器值', '如见绑定概览']) {
        const doc = await vscode.workspace.openTextDocument({ language: 'ru', content: '' });
        const ed = await vscode.window.showTextDocument(doc);
        const body = require('../snippets/ru.json')[name].body.join('\n');
        await ed.insertSnippet(new vscode.SnippetString(body));
        assert.equal(doc.getText(), body.replaceAll('$0', ''), `${name}: insertion only, never execute native code`);
    }
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
    for (const [name, expected] of [['作用域段','段:\n    值 取 1.\n    显 值.\n落.\n'], ['符号作用域块','{\n    值 取 1.\n    显 值.\n}.\n'], ['符号赋值','值 := 1.\n']]) {
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
    const graphicsDoc = await vscode.workspace.openTextDocument({language:'ru', content:'图 其 旋转 0.3.\n图 其 保存.\n旋转 取 1.\n批. 其 保存.'});
    for (const line of [0,1]) {
        const found = await vscode.commands.executeCommand('vscode.executeHoverProvider', graphicsDoc.uri, new vscode.Position(line,4));
        assert.ok(found.some(h => h.contents.some(c => c.value?.includes('Ru 0.19.0／如书 0.8.0'))), 'graphics member hover registered');
    }
    for (const [line,col] of [[2,0],[3,6]]) {
        const hidden = await vscode.commands.executeCommand('vscode.executeHoverProvider', graphicsDoc.uri, new vscode.Position(line,col));
        assert.equal(hidden.length,0,'ordinary name/comment has no graphics hover');
    }
    const newGraphicsDoc = await vscode.workspace.openTextDocument({language:'ru', content:'观 其 颜色 255 0 0 128.\n图 其 文字对齐 横向:\'中\' 纵向:\'基线\'.\n显 图 其 经过秒.\n显 图 其 间隔秒.\n经过秒 取 1.\n“其 颜色”.\n批. 其 文字对齐.'});
    for (const [line, col, version] of [[0,4,'0.19.1'],[1,4,'0.19.2'],[2,6,'0.19.3'],[3,6,'0.19.3']]) {
        const found = await vscode.commands.executeCommand('vscode.executeHoverProvider', newGraphicsDoc.uri, new vscode.Position(line,col));
        assert.ok(found.some(h => h.contents.some(c => c.value?.includes(version))), 'new graphics member hover registered');
    }
    for (const [line,col] of [[4,0],[5,3],[6,6]]) {
        const hidden = await vscode.commands.executeCommand('vscode.executeHoverProvider', newGraphicsDoc.uri, new vscode.Position(line,col));
        assert.equal(hidden.length,0,'ordinary name/string/comment has no new graphics hover');
    }
    const pathGraphicsDoc = await vscode.workspace.openTextDocument({language:'ru', content:'图 其 弧 20 20 80 80 0 1.\n图 其 扇形 20 20 80 80 0 1.\n图 其 折线 [[0,0],[20,20]].\n图 其 贝塞尔 0 0 0 20 20 0 20 20.\n贝塞尔 取 1.\n“其 折线”.\n批. 其 扇形.'});
    for (const [line, version] of [[0,'0.19.4'],[1,'0.19.4'],[2,'0.19.5'],[3,'0.19.6']]) {
        const found = await vscode.commands.executeCommand('vscode.executeHoverProvider', pathGraphicsDoc.uri, new vscode.Position(line,4));
        assert.ok(found.some(h => h.contents.some(c => c.value?.includes(version))), 'path member hover registered');
    }
    for (const [line,col] of [[4,0],[5,3],[6,6]]) {
        const hidden = await vscode.commands.executeCommand('vscode.executeHoverProvider', pathGraphicsDoc.uri, new vscode.Position(line,col));
        assert.equal(hidden.length,0,'ordinary name/string/comment has no path hover');
    }
    const cacheDoc = await vscode.workspace.openTextDocument({language:'ru', content:'图 其 缓存.\n图 其 贴图.\n底图 其 宽.\n底图 其 高.\n缓存 取 1.\n“其 贴图”.\n批. 其 宽.'});
    for (const [line, character] of [[0,4],[1,4],[2,5],[3,5]]) {
        const found = await vscode.commands.executeCommand('vscode.executeHoverProvider', cacheDoc.uri, new vscode.Position(line,character));
        assert.ok(found.some(h => h.contents.some(c => c.value?.includes('Ru 0.19.8／如书 0.8.8'))), 'cache member hover registered');
    }
    for (const [line, character] of [[4,0],[5,3],[6,6]]) {
        const hidden = await vscode.commands.executeCommand('vscode.executeHoverProvider', cacheDoc.uri, new vscode.Position(line,character));
        assert.ok(!hidden.some(h => h.contents.some(c => c.value?.includes('Ru 0.19.8／如书 0.8.8'))), 'cache hover suppressed');
    }
    for (const name of ['文本整理','数学计算','随机种子','阵删弹查','典命名参数','如观绘图','如观动画交互','如观形状变换','透明颜色','如观透明文字','如观计时动画','如观弧与扇形','如观折线','如观贝塞尔','如观不可变缓存']) {
        const doc=await vscode.workspace.openTextDocument({language:'ru',content:''});
        const ed=await vscode.window.showTextDocument(doc);
        ed.options = {insertSpaces:true,tabSize:4};
        const body=require('../snippets/ru.json')[name].body.join('\n');
        await ed.insertSnippet(new vscode.SnippetString(body));
        assert.equal(doc.getText(),body.replace('$0','').replaceAll('\t','    '),name);
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
        // Ordinary (non-background) VS Code task matchers buffer the current file's
        // Problems until task completion. Waiting before sending stdin deadlocks.
        await until(() => vscode.languages.getDiagnostics(document.uri).some(d => d.message === '运行错误：测试定位'), 'stderr diagnostic after exit');
        const diagnostic = vscode.languages.getDiagnostics(document.uri).find(d => d.message === '运行错误：测试定位');
        assert.equal(diagnostic.range.start.line, 0, 'one-based text line becomes zero-based API line');
        assert.equal(diagnostic.range.start.character, 0, 'line navigation intentionally ignores codepoint column');
        assert.equal(diagnostic.severity, vscode.DiagnosticSeverity.Error);
        assert.equal(diagnostic.source, '如言');
        const result = JSON.parse(await fs.readFile(report, 'utf8'));
        assert.deepEqual(result.argv, ['run', file, '--', 'a b', '你好', '$(no shell)']);
        assert.equal(result.cwd, root);
        assert.equal(result.stdin.trim(), '终端输入 hello');
        await until(() => vscode.tasks.taskExecutions.length === 0, 'task cleanup');
        await writeHelper('运行错误：重复定位', 7);
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('ru.runFile');
        await until(() => starts.length === 2, 'repeat after exit');
        vscode.window.activeTerminal.sendText('second');
        await until(() => ends.length === 2, 'second exit');
        assert.equal(ends[1].exitCode, 7);
        await until(() => vscode.languages.getDiagnostics(document.uri).some(d => d.message === '运行错误：重复定位'), 'fresh stderr diagnostic after rerun');
        assert.deepEqual(vscode.languages.getDiagnostics(document.uri).filter(d => d.source === '如言').map(d => d.message), ['运行错误：重复定位'], 'rerun replaces the old diagnostic');
        await until(() => vscode.tasks.taskExecutions.length === 0, 'second task cleanup');
        await writeHelper(undefined, 0);
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('ru.runFile');
        await until(() => starts.length === 3, 'clean rerun start');
        vscode.window.activeTerminal.sendText('clean');
        await until(() => ends.length === 3, 'clean rerun exit');
        assert.equal(ends[2].exitCode, 0);
        await until(() => !vscode.languages.getDiagnostics(document.uri).some(d => d.source === '如言'), 'clean rerun removes stale diagnostic');
        await until(() => vscode.tasks.taskExecutions.length === 0, 'clean task cleanup');
        console.log('PASS: real extension activation, association, process argv/cwd, terminal stdin, exit status, duplicate guard, rerun, post-exit Problems, diagnostic refresh and cleanup.');
    } finally {
        listeners.forEach(x => x.dispose());
        for (const execution of vscode.tasks.taskExecutions) {
            if (execution.task.definition.type === 'ru') execution.terminate();
        }
    }
};
