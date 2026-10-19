"""Execute the package snippets only in a temporary local package fixture."""
import json
from pathlib import Path
import re
import subprocess
import sys
import tempfile

root = Path(sys.argv[1]).resolve()
sys.path.insert(0, str(root))
from rulang.packages import load_manifest
from rulang.frontend import KEYWORDS, RuError, parse, validate

snippets = json.loads(Path(sys.argv[2]).read_text(encoding='utf-8'))
# Compare the editor's actual behavior to this toolchain, rather than assuming
# contextual terminators such as 终 are globally reserved.
editor = Path(sys.argv[2]).resolve().parent.parent / 'out/packages.js'
checked = subprocess.run(['node', '-e', "const {packageTokens}=require(process.argv[1]); const words=JSON.parse(process.argv[2]); console.log(JSON.stringify(words.map(word=>{const s='吾 言 工程 其 '+word+'.';return packageTokens(s).length;})));", str(editor), json.dumps(sorted(KEYWORDS), ensure_ascii=False)], capture_output=True, text=True, timeout=10)
assert checked.returncode == 0, checked.stderr
assert json.loads(checked.stdout) == [0] * len(KEYWORDS)
validate(parse('吾 言 工程 其 终.'))
validate(parse("试: 卒 '失败'. 救 原因: 显 原因. 终. 吾 言 工程."))
def expand(name):
    defaults = {}
    def default(match):
        defaults[match[1]] = match[2]
        return match[2]
    text = re.sub(r'\$\{(\d+):([^}]*)\}', default, '\n'.join(snippets[name]['body']))
    return re.sub(r'\$\{(\d+)\}', lambda m: defaults[m[1]], text).replace('$0', '')

with tempfile.TemporaryDirectory(prefix='ru vscode packages ') as temporary:
    base = Path(temporary)
    library, app = base / '工程', base / '应用'
    (library / 'src').mkdir(parents=True)
    app.mkdir()
    manifest = library / '集录.ru'
    manifest.write_text(expand('静态包清单'), encoding='utf-8')
    loaded = load_manifest(manifest)
    assert loaded.name == '工程'
    assert loaded.public[('工程', '力学')] == library / 'src/力学.ru'
    module = library / 'src/力学.ru'
    module.write_text(expand('具名模块声明') + '\n算 动量 质量 速度: 得 质量 * 速度. 法.\n', encoding='utf-8')
    app_manifest = app / '集录.ru'
    app_manifest.write_text("典: '名' 对 '应用'. '依赖' 对 典: '物理' 对 典: '路径' 对 '../工程'. 成. 成. 成.\n", encoding='utf-8')
    def cli(*args):
        return subprocess.run([sys.executable, str(root / 'ru'), *map(str, args)], capture_output=True, text=True, timeout=60)
    for name, call in [('具名模块导入', '力 其 动量'), ('具名全量导入', '动量')]:
        main = app / 'main.ru'
        main.write_text(expand(name) + f'\n显 {call} 2 3.\n', encoding='utf-8')
        for command in ('check', 'run'):
            result = cli(command, main)
            assert result.returncode == 0, (name, command, result.stderr)
            if command == 'run': assert result.stdout == '6\n'
        js = base / 'program.js'
        result = cli('build', main, '--target', 'js', '-o', js)
        assert result.returncode == 0, result.stderr
        result = subprocess.run(['node', str(js)], capture_output=True, text=True, timeout=10)
        assert result.returncode == 0 and result.stdout == '6\n', result.stderr
        executable = base / ('program.exe' if sys.platform == 'win32' else 'program')
        result = cli('build', main, '-o', executable)
        assert result.returncode == 0, result.stderr
        result = subprocess.run([str(executable)], capture_output=True, text=True, timeout=10)
        assert result.returncode == 0 and result.stdout == '6\n', result.stderr
    for field, value in [('名', "'重复'"), ('未知', '1'), ('公开', '7')]:
        manifest.write_text("典:\n'名' 对 '工程'.\n" + f"'{field}' 对 {value}.\n成.\n", encoding='utf-8')
        try:
            load_manifest(manifest)
            raise AssertionError('invalid manifest was accepted')
        except RuError as error:
            assert error.line == 3 and error.source_name == str(manifest), str(error)
        result = cli('check', main)
        assert result.returncode != 0 and f'{manifest}:3:' in result.stderr, result.stderr
    manifest.write_text(expand('静态包清单'), encoding='utf-8')
    app_manifest.write_text("{'名':'应用','依赖':{'物理':{'Git':'https://example.invalid/engineering.git'}}}.\n", encoding='utf-8')
    result = cli('check', main)
    assert result.returncode != 0 and 'deps sync' in result.stderr, result.stderr
    print('PASS: all 4 package snippets; static manifest, canonical declaration/consumer alias; named and import-all Python/check/C/Node.js output 6; exact manifest diagnostic lines and offline missing-cache sync hint.')
