const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildLaunchPlan } = require('../out/launch');
const base = { interpreterPath: '', interpreterArguments: ['-u'], cliPath: '', workingDirectory: '${fileDirname}', programArguments: [] };
test('default interpreter runs module from file directory', () => {
    assert.deepEqual(buildLaunchPlan(base, '/tmp/你好 空格.ru', undefined, 'linux'), {
        executable: 'python3', args: ['-u', '-m', 'rulang', 'run', '/tmp/你好 空格.ru'], cwd: '/tmp', cliPath: undefined
    });
});
test('explicit CLI and executable paths expand independently of cwd', () => {
    assert.deepEqual(buildLaunchPlan({ ...base, interpreterPath: '${workspaceFolder}/venv/bin/python',
        cliPath: '${workspaceFolder}/如 工具/ru', workingDirectory: 'data', programArguments: ['--flag', 'a b', '$(touch nope)', '你好', ''] },
    '/work/src/a; echo bad.ru', '/work', 'linux'), {
        executable: '/work/venv/bin/python', cliPath: '/work/如 工具/ru', cwd: '/work/data',
        args: ['-u', '/work/如 工具/ru', 'run', '/work/src/a; echo bad.ru', '--', '--flag', 'a b', '$(touch nope)', '你好', '']
    });
});
test('Windows paths and arguments are not shell quoted', () => {
    const actual = buildLaunchPlan({ ...base, cliPath: 'C:\\工具 空格\\ru', programArguments: ['a&b', '"quoted"'] }, 'C:\\题目\\一 二.ru', undefined, 'win32');
    assert.equal(actual.executable, 'python');
    assert.equal(actual.cwd, 'C:\\题目');
    assert.deepEqual(actual.args, ['-u', 'C:\\工具 空格\\ru', 'run', 'C:\\题目\\一 二.ru', '--', 'a&b', '"quoted"']);
});
test('relative executable path is anchored, plain command uses PATH', () => {
    assert.equal(buildLaunchPlan({ ...base, interpreterPath: './venv/bin/python' }, '/a/b.ru', '/project', 'linux').executable, '/project/venv/bin/python');
    assert.equal(buildLaunchPlan({ ...base, interpreterPath: 'python3.12' }, '/a/b.ru', undefined, 'linux').executable, 'python3.12');
});
test('invalid configuration fails before execution', () => {
    for (const override of [{ interpreterArguments: 'python -u' }, { programArguments: [42] }, { cliPath: 'a\0b' },
        { interpreterPath: 'ru.cmd' }, { workingDirectory: '${workspaceFolder}' }, { workingDirectory: '${env:HOME}' }, { interpreterArguments: ['a\nb'] }]) {
        assert.throws(() => buildLaunchPlan({ ...base, ...override }, '/a/b.ru', undefined, 'linux'));
    }
    assert.throws(() => buildLaunchPlan(base, 'relative.ru', undefined, 'linux'));
});

test('VS Code task-variable syntax cannot expand filenames or literal arguments', () => {
    assert.throws(() => buildLaunchPlan(base, '/tmp/${env:HOME}.ru', undefined, 'linux'), /task-variable/);
    for (const override of [{ programArguments: ['${command:workbench.action.closeWindow}'] }, { interpreterArguments: ['${env:HOME}'] }]) {
        assert.throws(() => buildLaunchPlan({ ...base, ...override }, '/tmp/a.ru', undefined, 'linux'), /task-variable/);
    }
});
