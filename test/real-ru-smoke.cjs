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
        if (name === '典逐目回调') source = `表 取 典: ‘上’ 对 0. 成.\n${source}`;
        if (name.startsWith('匿名')) source = `回调 取 ${source.trim()}.\n`;
        if (name === '过程提前结束') source = `作 提前结束:\n${source}\n为\n`;
        const file = path.join(temp, `${name}.ru`);
        fs.writeFileSync(file, source);
        const result = cp.spawnSync(interpreterPath, [cli, 'check', file], { encoding: 'utf8', timeout: 10000 });
        if (name.startsWith('如观')) {
            assert.notEqual(result.status, 0, 'CLI check must report notebook-only graphics');
            assert.match(result.stderr, /如书/);
            const graphicsHost = cp.spawnSync(interpreterPath, [path.join(__dirname, 'graphics-snippet-smoke.py'), path.resolve(root), file, name], { encoding: 'utf8', timeout: 10000 });
            assert.equal(graphicsHost.status, 0, graphicsHost.stderr || String(graphicsHost.error));
        } else if (name === '透明颜色') {
            // check covers compiled-target capabilities; Python run alone can construct colors.
            assert.notEqual(result.status, 0, 'CLI check still rejects the 如:观 module');
            assert.match(result.stderr, /如书/);
        } else assert.equal(result.status, 0, `${name}: ${result.stderr || result.error}`);
        if (name.startsWith('如观') || name === '透明颜色') {
            const browserRuntime = cp.spawnSync(interpreterPath, [path.join(__dirname, 'browser-snippet-smoke.py'), path.resolve(root), file, name], { encoding: 'utf8', timeout: 15000 });
            assert.equal(browserRuntime.status, 0, `${name} browser runtime: ${browserRuntime.stderr || browserRuntime.error}`);
        }
        if (name === '竞赛模板') {
            const contest = cp.spawnSync(interpreterPath, [cli, 'run', file], { input: '42\n', encoding: 'utf8', timeout: 10000 });
            assert.equal(contest.status, 0, contest.stderr);
            assert.equal(contest.stdout, '42\n');
        }
        if (name.startsWith('如观')) {
            const graphics = cp.spawnSync(interpreterPath, [cli, 'run', file], { encoding: 'utf8', timeout: 10000 });
            assert.notEqual(graphics.status, 0, 'ordinary CLI must not silently run notebook graphics');
            assert.match(graphics.stderr, /如书/);
        }
        const expectedPractical = {
            '透明颜色': '#ff404080\n#4070ff80\n',
            '文本整理': '[小明, 小红]\n你好\n梨\n3.50\n',
            '数学计算': '9\n32\n-1\n-2\n-1\n-2\n',
            '典命名参数': '0\n2\n真\n1\n',
            '阵删弹查': '1\n车\n船\n空\n',
            '阵逐位回调': '1\n桃\n空\n空\n170\n',
            '阵排序另成': '[1, 1, 2, 3]\n[3, 1, 2, 1]\n[3, 2, 1, 1]\n[乙, 甲, 丙]\n2\n7\n7\n[空, 空]\n'
        };
        if (name in expectedPractical || name === '随机种子') {
            const run = cp.spawnSync(interpreterPath, [cli, 'run', file], { encoding: 'utf8', timeout: 10000 });
            assert.equal(run.status, 0, `${name}: ${run.stderr || run.error}`);
            if (name in expectedPractical) assert.equal(run.stdout, expectedPractical[name], name);
            else {
                const lines=run.stdout.trim().split('\n');
                assert.match(lines[0], /^[1-6]$/);
                assert.equal(lines[1], '[甲, 乙, 丙, 丁]');
                assert.deepEqual(lines[2].slice(1,-1).split(', ').sort(), ['甲','乙','丙','丁'].sort());
                const repeat=cp.spawnSync(interpreterPath, [cli, 'run', file], {encoding:'utf8',timeout:10000});
                assert.equal(repeat.status,0,repeat.stderr); assert.equal(repeat.stdout,run.stdout);
            }
        }
    }
    for (const [oldName, canonical] of [['如竞', '如:竞'], ['如观', '如:观'], ['如:竞赛', '如:竞']]) {
        const oldModuleFile = path.join(temp, 'legacy-module.ru');
        fs.writeFileSync(oldModuleFile, `模块 取 外言 '${oldName}'.\n`);
        const oldModule = cp.spawnSync(interpreterPath, [cli, 'run', oldModuleFile], { encoding: 'utf8', timeout: 10000 });
        assert.notEqual(oldModule.status, 0, 'removed module alias must not run');
        assert.ok(oldModule.stderr.includes(canonical), oldModule.stderr);
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
显 表 其 查 目:‘上’.
显 表 其 除 目:‘下’.
显 表 其 除 目:‘下’.
表 其 增 目:‘左’ 相:3.
显 表 其 量.
表 其 逐目 作 键, 值:
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
    for (const call of ["查 键:'上'", "除 键:'上'", "增 键:'下' 值:2", "增 目:'下' 值:2"]) {
        fs.writeFileSync(file, `表 取 {'上': 0}.\n表 其 ${call}.\n`);
        const oldNamed = cp.spawnSync(plan.executable, plan.args, { cwd: plan.cwd, encoding: 'utf8', timeout: 10000 });
        assert.notEqual(oldNamed.status, 0, `legacy dictionary arguments accepted: ${call}`);
        assert.ok(oldNamed.stderr, `expected a runtime diagnostic: ${call}`);
    }
    fs.writeFileSync(file, "表 取 {'上': 0}.\n表 其 逐目 回调:(作 键, 值: 显 值. 为).\n阵列 取 [].\n阵列 其 增 值:2.\n显 阵列 其 查 值:2.\n");
    const unchangedNamed = cp.spawnSync(plan.executable, plan.args, { cwd: plan.cwd, encoding: 'utf8', timeout: 10000 });
    assert.equal(unchangedNamed.status, 0, unchangedNamed.stderr || String(unchangedNamed.error));
    assert.equal(unchangedNamed.stdout, '0\n0\n');
    fs.writeFileSync(file, "表 取 {'心': 0, '意': 1}.\n显 表 其 查 '意'.\n显 {} 其 量.\n");
    const symbols = cp.spawnSync(plan.executable, plan.args, { cwd: plan.cwd, encoding: 'utf8', timeout: 10000 });
    assert.equal(symbols.status, 0, symbols.stderr || String(symbols.error));
    assert.equal(symbols.stdout, '1\n0\n');
    fs.writeFileSync(file, `值 取 1.
段:
    值 := 2.
    显 值.
    段:
        值 ：= 3.
        显 值.
    落.
    显 值.
落.
显 值.
{
    值 := 4.
    显 值.
}
显 值.
表 := {'心': 0}.
表 其 增 '意' 1.
显 表 其 查 '意'.
`);
    const scopes = cp.spawnSync(plan.executable, plan.args, { cwd: plan.cwd, encoding: 'utf8', timeout: 10000 });
    assert.equal(scopes.status, 0, scopes.stderr || String(scopes.error));
    assert.equal(scopes.stdout, '2\n3\n2\n1\n4\n1\n1\n');
    console.log('PASS: CLI snippets checked by actual Ru; graphics snippets executed twice with GraphicsHost and compiled browser runtime, CLI/check rejection and pure-color CLI exception verified; Unicode/space/metacharacter paths, argv, stdin, and explicit/natural procedure completion through real interpreter.');
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
