// Optional integration with the separately installed Ru toolchain, never downloaded automatically.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const { buildLaunchPlan } = require('../out/launch');
const root = process.env.RU_LANGUAGE_ROOT;
assert.ok(root, 'Set RU_LANGUAGE_ROOT to the separate ru-language checkout.');
const cli = path.join(path.resolve(root), 'ru');
const interpreterPath = process.env.RU_PYTHON || (process.platform === 'win32' ? 'python' : 'python3');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ru vscode smoke '));
try {
    for (const [name, snippet] of Object.entries(require('../snippets/ru.json'))) {
        const defaults = {};
        let source = snippet.body.join('\n').replace(/\$\{(\d+):([^}]*)\}/g, (_, key, value) => (defaults[key] = value))
            .replace(/\$\{(\d+)\}/g, (_, key) => defaults[key]).replaceAll('$0', '');
        if (name.startsWith('匿名')) source = `回调 取 ${source.trim()}.\n`;
        if (name === '过程提前结束') source = `作 提前结束:\n${source}\n为\n`;
        const file = path.join(temp, `${name}.ru`);
        fs.writeFileSync(file, source);
        const result = cp.spawnSync(interpreterPath, [cli, 'check', file], { encoding: 'utf8', timeout: 10000 });
        assert.equal(result.status, 0, `${name}: ${result.stderr || result.error}`);
    }
    const file = path.join(temp, '你好 空 格;$(no shell).ru');
    fs.writeFileSync(file, '算 元初 外参 为 句 阵:\n    显 外参.\n    显 读.\n    得 0.\n法\n');
    const plan = buildLaunchPlan({ interpreterPath, interpreterArguments: ['-u'], cliPath: cli,
        workingDirectory: '${fileDirname}', programArguments: ['空 格', '$(no shell)'] }, file);
    const result = cp.spawnSync(plan.executable, plan.args, { cwd: plan.cwd, encoding: 'utf8', input: '互动 中文\n', timeout: 10000 });
    assert.equal(result.status, 0, result.stderr || String(result.error));
    assert.equal(result.stdout, '[空 格, $(no shell)]\n互动 中文\n');
    for (const dot of ['.', '。']) {
        fs.writeFileSync(file, `作 提前:\n    完${dot}\n    显 '不应执行'.\n为\n作 自然:\n为\n显 提前.\n显 自然.\n`);
        const finish = cp.spawnSync(plan.executable, plan.args, { cwd: plan.cwd, encoding: 'utf8', timeout: 10000 });
        assert.equal(finish.status, 0, finish.stderr || String(finish.error));
        assert.equal(finish.stdout, '空\n空\n');
    }
    fs.writeFileSync(file, '算 原样 值:\n    得 值.\n法\n算 选择 值, 次数 为 数:\n    得 值.\n法\n回调 取 算 值: 得 值. 法.\n过程 取 作 值: 完. 为.\n显 原样 空.\n显 选择 空 2.\n显 回调 空.\n显 过程 空.\n');
    const optional = cp.spawnSync(plan.executable, plan.args, { cwd: plan.cwd, encoding: 'utf8', timeout: 10000 });
    assert.equal(optional.status, 0, optional.stderr || String(optional.error));
    assert.equal(optional.stdout, '空\n空\n空\n空\n');
    fs.writeFileSync(file, "算 回 值: 得 值. 法\n显 算 回 值:1.\n变量 取 2. 算 回 变量. 算 回 值:3.\n作 报 内容: 显 内容. 为\n作 报 内容:'好'.\n");
    const references = cp.spawnSync(plan.executable, plan.args, { cwd: plan.cwd, encoding: 'utf8', timeout: 10000 });
    assert.equal(references.status, 0, references.stderr || String(references.error));
    assert.equal(references.stdout, '1\n好\n');
    console.log('PASS: eighteen snippets checked by actual Ru; Unicode/space/metacharacter paths, argv, stdin, and explicit/natural procedure completion through real interpreter.');
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
