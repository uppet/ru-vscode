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
        if (name === '典字面量' || name === '空典' || name === '符号典' || name === '符号空典') source = `表 取 ${source.trim()}.\n`;
        if (name === '典列回调') source = `表 取 典: ‘上’ 对 0. 成.\n${source}`;
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
    fs.writeFileSync(file, `表 取 典: ‘上’ 对 0. ‘下’ 对 2. 成.
显 表 其 查 ‘上’.
显 表 其 除 ‘下’.
显 表 其 除 ‘下’.
表 其 增 ‘左’ 3.
显 表 其 量.
表 其 列 作 键, 值:
    显 值.
    表 其 除 键.
为.
显 表 其 量.
显 0 为 事实.
显 '' 为 事实.
显 [] 为 事实.
显 (典: 成) 为 事实.
显 空 为 事实.
显 假 为 事实.
显 1 == 1.
算 确认 值 为 事实: 得 值. 法
显 确认 真.
`);
    const maps = cp.spawnSync(plan.executable, plan.args, { cwd: plan.cwd, encoding: 'utf8', timeout: 10000 });
    assert.equal(maps.status, 0, maps.stderr || String(maps.error));
    const lines = maps.stdout.trim().split('\n');
    assert.deepEqual(lines.slice(0,4), ['0','真','假','2']);
    assert.deepEqual(lines.slice(4,6).sort(), ['0','3']); // snapshot iteration order is unspecified
    assert.deepEqual(lines.slice(6), ['0','真','真','真','真','假','假','真','真']);
    fs.writeFileSync(file, "表 取 {'心': 0, '意': 1}.\n显 表 其 查 '意'.\n显 {} 其 量.\n");
    const symbols = cp.spawnSync(plan.executable, plan.args, { cwd: plan.cwd, encoding: 'utf8', timeout: 10000 });
    assert.equal(symbols.status, 0, symbols.stderr || String(symbols.error));
    assert.equal(symbols.stdout, '1\n0\n');
    console.log('PASS: all snippets checked by actual Ru; Unicode/space/metacharacter paths, argv, stdin, and explicit/natural procedure completion through real interpreter.');
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
