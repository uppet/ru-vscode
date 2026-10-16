const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ru extension '));
function setup(options = {}) {
    let endTask;
    const commands = {};
    const messages = [], executions = [], events = [];
    const file = path.join(tmp, '题 目;$(bad).ru');
    const document = { languageId: 'ru', isUntitled: false, isDirty: false, isClosed: false, version: 1, getText: () => '显 1.',
        uri: { scheme: 'file', fsPath: file, toString: () => file },
        save: async () => { events.push('save'); document.isUntitled = false; document.isDirty = false; return true; }, ...options.document };
    const api = {
        languages: { registerHoverProvider: () => ({ dispose() {} }) },
        window: { activeTextEditor: { document },
            showWarningMessage: async (...args) => { messages.push(args); return options.choice; },
            showInformationMessage: async m => { messages.push(m); }, showErrorMessage: async m => { messages.push(m); } },
        workspace: { isTrusted: options.trusted ?? true, getWorkspaceFolder: () => undefined,
            getConfiguration: () => ({ get: (key, fallback) => options.settings?.[key] ?? fallback }) },
        commands: { registerCommand: (id, cb) => { commands[id] = cb; return { dispose() {} }; } },
        tasks: { taskExecutions: [], onDidEndTask: cb => { endTask = cb; return { dispose() {} }; },
            executeTask: async task => { executions.push(task); if (options.fail) throw new Error('launch failed'); return { task }; } },
        Task: class { constructor(definition, scope, name, source, execution, problemMatchers) { Object.assign(this, { definition, scope, name, source, execution, problemMatchers }); } },
        ProcessExecution: class { constructor(process, args, options) { Object.assign(this, { process, args, options }); } },
        TaskScope: { Global: 1 }, TaskRevealKind: { Always: 1 }, TaskPanelKind: { Dedicated: 2 }
    };
    const load = Module._load;
    Module._load = function (name, ...args) { return name === 'vscode' ? api : name === 'node:fs/promises' && options.stat ? { stat: options.stat } : load.call(this, name, ...args); };
    delete require.cache[require.resolve('../out/extension')];
    try { require('../out/extension').activate({ subscriptions: [] }); } finally { Module._load = load; }
    return { command: commands['ru.runFile'], nativeCommand: commands['ru.runFileNative'], endTask: () => endTask({ execution: { task: executions.at(-1) } }), messages, executions, document, api, events };
}
test('run uses ProcessExecution with interactive terminal, exact Unicode argv and cwd', async () => {
    const x = setup(); await x.command();
    assert.equal(x.executions.length, 1);
    const task = x.executions[0];
    assert.deepEqual(task.execution.args, ['-u', '-m', 'rulang', 'run', x.document.uri.fsPath]);
    assert.equal(task.execution.options.cwd, tmp);
    assert.deepEqual(task.problemMatchers, ['$ru']);
    assert.equal(task.presentationOptions.focus, true);
    assert.equal(task.presentationOptions.clear, true);
});
test('modified/untitled buffers ask to save; declining never runs stale bytes', async () => {
    for (const state of [{ isDirty: true }, { isUntitled: true }]) {
        const x = setup({ document: state }); await x.command(); assert.equal(x.executions.length, 0); assert.equal(x.events.length, 0);
        const y = setup({ document: state, choice: '保存并运行' }); await y.command(); assert.equal(y.executions.length, 1); assert.deepEqual(y.events, ['save']);
    }
});
test('failed or cancelled Save As never runs', async () => {
    const x = setup({ document: { isUntitled: true, save: async () => false }, choice: '保存并运行' });
    await x.command(); assert.equal(x.executions.length, 0);
});
test('untrusted, wrong-language and virtual documents do not execute', async () => {
    for (const opts of [{ trusted: false }, { document: { languageId: 'text' } }, { document: { uri: { scheme: 'git', toString: () => 'git:sample', fsPath: '/bad' } } }]) {
        const x = setup(opts); await x.command(); assert.equal(x.executions.length, 0); assert.ok(x.messages.length);
    }
});
test('repeated invocation refuses live process, then allows completed task and reuses stable identity', async () => {
    const x = setup(); await Promise.all([x.command(), x.command()]); await x.command();
    assert.equal(x.executions.length, 1); x.endTask(); await x.command();
    assert.equal(x.executions.length, 2);
    assert.deepEqual(x.executions[0].definition, x.executions[1].definition);
});
test('active tasks survive extension reload duplicate protection', async () => {
    const x = setup(); x.api.tasks.taskExecutions.push({ task: { definition: { type: 'ru', file: x.document.uri.fsPath } } });
    await x.command(); assert.equal(x.executions.length, 0);
});
test('launch rejection unlocks retries and reports configuration hint', async () => {
    const x = setup({ fail: true }); await x.command(); await x.command();
    assert.equal(x.executions.length, 2); assert.match(x.messages[0], /ru.interpreterPath/);
});
test('invalid working directory is reported before task creation', async () => {
    const x = setup({ settings: { workingDirectory: path.join(tmp, 'does not exist') } });
    await x.command(); assert.equal(x.executions.length, 0); assert.ok(x.messages.length);
});

test('Save As can replace the original untitled TextDocument', async () => {
    const x = setup({ document: { isUntitled: true }, choice: '保存并运行' });
    const saved = { ...x.document, isUntitled: false };
    x.document.save = async () => { x.document.isClosed = true; x.api.window.activeTextEditor.document = saved; return true; };
    await x.command(); assert.equal(x.executions.length, 1);
});
test('switching to unrelated file during Save As never runs it', async () => {
    const x = setup({ document: { isUntitled: true }, choice: '保存并运行' });
    x.document.save = async () => { x.api.window.activeTextEditor.document = { ...x.document, isUntitled: false, getText: () => '显 99.' }; return true; };
    await x.command(); assert.equal(x.executions.length, 0);
});


test('native command requires exact one-shot modal consent and names its target and risk', async () => {
    for (const choice of [undefined, '取消', '保存并运行', '允许原生运行一次']) {
        const x = setup({ choice }); await x.nativeCommand();
        assert.equal(x.executions.length, choice === '允许原生运行一次' ? 1 : 0);
        assert.deepEqual(x.events, []);
        const [message, options, action] = x.messages[0];
        assert.match(message, /原生代码/); assert.equal(options.modal, true);
        assert.ok(options.detail.includes(x.document.uri.fsPath));
        for (const text of ['当前账户权限', '读写文件', '访问网络', '崩溃', '不是安全沙箱', '本次', '不会保存长期授权'])
            assert.ok(options.detail.includes(text), text);
        assert.equal(action, '允许原生运行一次');
        if (x.executions.length) assert.deepEqual(x.executions[0].execution.args,
            ['-u', '-m', 'rulang', 'run', '--allow-native', x.document.uri.fsPath]);
    }
});
test('dirty native command combines consent and save; cancel never saves', async () => {
    for (const choice of [undefined, '允许原生运行一次', '保存并允许原生运行一次']) {
        const x = setup({ document: { isDirty: true }, choice }); await x.nativeCommand();
        const approved = choice === '保存并允许原生运行一次';
        assert.deepEqual(x.events, approved ? ['save'] : []);
        assert.equal(x.executions.length, approved ? 1 : 0);
        assert.equal(x.messages[0][2], '保存并允许原生运行一次');
    }
    const x = setup({ document: { isDirty: true, save: async () => false }, choice: '保存并允许原生运行一次' });
    await x.nativeCommand(); assert.equal(x.executions.length, 0);
});
test('native command refuses untitled, virtual, untrusted and non-Ru documents before consent or save', async () => {
    for (const options of [{ document: { isUntitled: true, isDirty: true } }, { trusted: false },
        { document: { languageId: 'text' } },
        { document: { uri: { scheme: 'git', fsPath: '/bad', toString: () => 'git:sample' } } }]) {
        const x = setup({ ...options, choice: '保存并允许原生运行一次' }); await x.nativeCommand();
        assert.equal(x.executions.length, 0); assert.deepEqual(x.events, []);
        assert.ok(x.messages.every(message => !Array.isArray(message) || !message[1]?.modal), 'no consent for unknown target');
    }
});
test('native approval is invalidated by changed version, content, URI, editor, language, closure or trust', async () => {
    const changes = [
        x => { x.document.version++; },
        x => { x.document.getText = () => '显 2.'; },
        x => { x.document.uri = { ...x.document.uri, toString: () => '/different.ru' }; },
        x => { x.api.window.activeTextEditor.document = { ...x.document }; },
        x => { x.api.window.activeTextEditor = undefined; },
        x => { x.document.languageId = 'text'; },
        x => { x.document.isClosed = true; },
        x => { x.api.workspace.isTrusted = false; }
    ];
    for (const change of changes) {
        const x = setup({ document: { isDirty: true } });
        x.api.window.showWarningMessage = async () => { change(x); return '保存并允许原生运行一次'; };
        await x.nativeCommand(); assert.deepEqual(x.events, []); assert.equal(x.executions.length, 0);
        assert.ok(x.messages.some(message => typeof message === 'string' && /取消|变化/.test(message)));
    }
});
test('save participants and editor changes during native save invalidate consent', async () => {
    for (const change of [x => { x.document.version++; }, x => { x.api.window.activeTextEditor.document = { ...x.document }; },
        x => { x.document.isDirty = true; }, x => { x.api.workspace.isTrusted = false; }]) {
        const x = setup({ document: { isDirty: true }, choice: '保存并允许原生运行一次' });
        x.document.save = async () => { x.events.push('save'); x.document.isDirty = false; change(x); return true; };
        await x.nativeCommand(); assert.deepEqual(x.events, ['save']); assert.equal(x.executions.length, 0);
    }
});
test('native target is rechecked after asynchronous filesystem validation', async () => {
    for (const change of [x => { x.document.version++; }, x => { x.api.window.activeTextEditor = undefined; },
        x => { x.api.workspace.isTrusted = false; }, x => { x.api.tasks.taskExecutions.push({ task: { definition: { type: 'ru', file: x.document.uri.fsPath } } }); }]) {
        const x = setup({ choice: '允许原生运行一次', stat: async () => { change(x); return { isDirectory: () => true }; } });
        await x.nativeCommand(); assert.equal(x.executions.length, 0);
    }
});
test('ordinary and native commands share pending consent/save and live-task duplicate protection', async () => {
    for (const nativeFirst of [true, false]) {
        const x = setup({ document: { isDirty: true } });
        let resolve;
        x.api.window.showWarningMessage = () => new Promise(r => { resolve = r; });
        const first = nativeFirst ? x.nativeCommand : x.command;
        const second = nativeFirst ? x.command : x.nativeCommand;
        const pending = first(); await second();
        assert.equal(x.executions.length, 0); assert.deepEqual(x.events, []);
        resolve(nativeFirst ? '保存并允许原生运行一次' : '保存并运行');
        await pending; await second(); assert.equal(x.executions.length, 1);
        x.endTask();
        x.api.window.showWarningMessage = async () => '允许原生运行一次';
        await second(); assert.equal(x.executions.length, 2);
    }
});
test('native consent is requested anew after completion or cancellation and failures unlock retries', async () => {
    const x = setup({ choice: '允许原生运行一次' });
    await x.nativeCommand(); x.endTask(); await x.nativeCommand();
    assert.equal(x.executions.length, 2); assert.equal(x.messages.filter(Array.isArray).length, 2);
    const y = setup(); await y.nativeCommand();
    y.api.window.showWarningMessage = async () => '允许原生运行一次';
    await y.nativeCommand(); assert.equal(y.executions.length, 1);
    const z = setup({ choice: '允许原生运行一次', fail: true });
    await z.nativeCommand(); await z.nativeCommand(); assert.equal(z.executions.length, 2);
});
test('ordinary program arguments cannot substitute for native capability; native argv preserves both argument classes', async () => {
    const settings = { interpreterArguments: ['-u', '-X', 'utf8'], programArguments: ['--allow-native', 'a b'] };
    const x = setup({ settings }); await x.command();
    assert.deepEqual(x.executions[0].execution.args,
        ['-u', '-X', 'utf8', '-m', 'rulang', 'run', x.document.uri.fsPath, '--', '--allow-native', 'a b']);
    const y = setup({ settings, choice: '允许原生运行一次' }); await y.nativeCommand();
    assert.deepEqual(y.executions[0].execution.args,
        ['-u', '-X', 'utf8', '-m', 'rulang', 'run', '--allow-native', y.document.uri.fsPath, '--', '--allow-native', 'a b']);
});
