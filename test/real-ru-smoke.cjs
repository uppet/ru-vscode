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
    console.log('PASS: twelve snippets checked by actual Ru; Unicode/space/metacharacter paths, argv, and stdin round-trip through real interpreter.');
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
