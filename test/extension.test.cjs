const { test } = require('node:test');
const assert = require('node:assert/strict');
const Module = require('node:module');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ru extension '));
function setup(options = {}) {
    let command, endTask;
    const messages = [], executions = [], events = [];
    const file = path.join(tmp, '题 目;$(bad).ru');
    const document = { languageId: 'ru', isUntitled: false, isDirty: false, isClosed: false, getText: () => '显 1.',
        uri: { scheme: 'file', fsPath: file, toString: () => file },
        save: async () => { events.push('save'); document.isUntitled = false; document.isDirty = false; return true; }, ...options.document };
    const api = {
        languages: { registerHoverProvider: () => ({ dispose() {} }) },
        window: { activeTextEditor: { document },
            showWarningMessage: async (...args) => { messages.push(args); return options.choice; },
            showInformationMessage: async m => { messages.push(m); }, showErrorMessage: async m => { messages.push(m); } },
        workspace: { isTrusted: options.trusted ?? true, getWorkspaceFolder: () => undefined,
            getConfiguration: () => ({ get: (key, fallback) => options.settings?.[key] ?? fallback }) },
        commands: { registerCommand: (id, cb) => { assert.equal(id, 'ru.runFile'); command = cb; return { dispose() {} }; } },
        tasks: { taskExecutions: [], onDidEndTask: cb => { endTask = cb; return { dispose() {} }; },
            executeTask: async task => { executions.push(task); if (options.fail) throw new Error('launch failed'); return { task }; } },
        Task: class { constructor(definition, scope, name, source, execution) { Object.assign(this, { definition, scope, name, source, execution }); } },
        ProcessExecution: class { constructor(process, args, options) { Object.assign(this, { process, args, options }); } },
        TaskScope: { Global: 1 }, TaskRevealKind: { Always: 1 }, TaskPanelKind: { Dedicated: 2 }
    };
    const load = Module._load;
    Module._load = function (name, ...args) { return name === 'vscode' ? api : load.call(this, name, ...args); };
    delete require.cache[require.resolve('../out/extension')];
    try { require('../out/extension').activate({ subscriptions: [] }); } finally { Module._load = load; }
    return { command, endTask: () => endTask({ execution: { task: executions.at(-1) } }), messages, executions, document, api, events };
}
test('run uses ProcessExecution with interactive terminal, exact Unicode argv and cwd', async () => {
    const x = setup(); await x.command();
    assert.equal(x.executions.length, 1);
    const task = x.executions[0];
    assert.deepEqual(task.execution.args, ['-u', '-m', 'rulang', 'run', x.document.uri.fsPath]);
    assert.equal(task.execution.options.cwd, tmp);
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
