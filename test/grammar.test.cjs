const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const tm = require('vscode-textmate');
const onig = require('vscode-oniguruma');
let grammar;
before(async () => {
    const wasm = fs.readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm'));
    await onig.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
    const registry = new tm.Registry({ onigLib: Promise.resolve({ createOnigScanner: p => new onig.OnigScanner(p), createOnigString: s => new onig.OnigString(s) }),
        loadGrammar: async () => tm.parseRawGrammar(fs.readFileSync(path.join(__dirname, '../syntaxes/ru.tmLanguage.json'), 'utf8'), 'ru.json') });
    grammar = await registry.loadGrammar('source.ru');
});
function scopes(line, index, stack) { return grammar.tokenizeLine(line, stack).tokens.find(t => t.startIndex <= index && t.endIndex > index).scopes; }
function has(line, fragment, scope) { assert.ok(scopes(line, line.indexOf(fragment)).includes(scope), `${fragment} in ${line}: ${scopes(line, line.indexOf(fragment))}`); }
test('keywords use full Unicode identifier boundaries', () => {
    for (const id of ['为乐', '显值', '算子', '取3', '_若', 'α算', '算²', '形状']) { has(id, id, 'variable.other.ru'); }
    has('若 值 则', '若', 'keyword.control.ru');
    has('若 值 则', '则', 'keyword.control.ru');
});
test('named and anonymous functions, references, and closers', () => {
    has('算 平方 值 为 数:', '平方', 'entity.name.function.ru');
    has('算 元初 外参 为 句 阵:', '元初', 'entity.name.function.ru');
    has('平方 取 算 值 为 数: 得 值*值. 法.', '值', 'variable.other.ru');
    has('算 名.', '名', 'variable.other.ru');
    has('作 名字:', '名字', 'entity.name.function.ru');
    for (const word of ['法', '然', '环', '象']) { has(word, word, 'keyword.control.ru'); }
    has('为.', '为', 'keyword.operator.word.ru');
    has('终.', '终', 'keyword.control.end.ru');
    has('终 取 2.', '终', 'variable.other.ru');
    has('列 其 段 始:0 终:2.', '终', 'variable.other.ru');
});
test('all four quote pairs, multiline strings, and escapes', () => {
    for (const [a, z] of [["'", "'"], ['"', '"'], ['‘', '’'], ['“', '”']]) {
        has(`${a}# 若 // 法 ${z}`, '若', 'string.quoted.ru');
        const state = grammar.tokenizeLine(`${a}first`).ruleStack;
        assert.ok(scopes(`然 ${z} 显 2.`, 0, state).includes('string.quoted.ru'));
        assert.ok(scopes(`然 ${z} 显 2.`, 4, state).includes('keyword.control.ru'));
    }
    has('"ok\\n"', '\\n', 'constant.character.escape.ru');
    has('"bad\\q"', '\\q', 'invalid.illegal.escape.ru');
    has('“escaped \\” yes”', '\\”', 'constant.character.escape.ru');
});
test('comments and division have distinct scopes', () => {
    has('值 / 2. // 算', '/', 'keyword.operator.ru');
    has('值 / 2. // 算', '算', 'comment.line.ru');
    has('# “nothing”', 'nothing', 'comment.line.ru');
});
test('numbers and full width punctuation', () => {
    for (const n of ['1', '2.5', '.5', '1e3', '2.5E-1']) { has(`显 ${n}.`, n, 'constant.numeric.ru'); }
    has('显 1.', '.', 'punctuation.separator.ru');
    has('显 （［1，2］）。', '（', 'punctuation.section.brackets.ru');
    has('显 （［1，2］）。', '，', 'punctuation.separator.ru');
});
test('conservative indentation handles common multiline block headers', () => {
    const config = require('../language-configuration.json');
    const increase = new RegExp(config.indentationRules.increaseIndentPattern);
    const decrease = new RegExp(config.indentationRules.decreaseIndentPattern);
    for (const line of ['算 平方 值 为 数:', '作 问候:', '形 点:', '若 条件 则', '循', '循 10 次', '试:', '救 原因:', '另', '平方 取 算 值 为 数:', '报到 取 作:']) { assert.ok(increase.test(line), line); }
    for (const line of ['# 算 平方:', '显 "算 平方:".', '为乐 取 2.', '算 名.', '显 1.']) { assert.ok(!increase.test(line), line); }
    for (const line of ['法', '为.', '象', '然', '环', '终.', '另', '救 原因:']) { assert.ok(decrease.test(line), line); }
    assert.ok(!decrease.test('为乐 取 1.'));
    assert.ok(!decrease.test('终 取 2.')); 
});
test('Chinese comments are adjacent markers, whole openers, nonnested, and string-safe', () => {
    for (const dot of ['.', '。']) {
        has(`批${dot} 显 1.`, '显', 'comment.line.ru');
        has(`解${dot} 显 1. 释${dot} 显 2.`, '1', 'comment.block.ru');
        const line = `解${dot} 解. '甲释${dot} 显 2.`;
        assert.ok(scopes(line, line.lastIndexOf('显')).includes('keyword.control.ru'));
        const stack = grammar.tokenizeLine(`解${dot} 批. // "`).ruleStack;
        assert.ok(scopes('若', 0, stack).includes('comment.block.ru'));
        assert.ok(scopes(`释${dot} 显 2.`, 3, stack).includes('keyword.control.ru'));
        for (const quote of ["'", '"', '‘', '“']) has(`${quote}批${dot} 解${dot} 取`, '取', 'string.quoted.ru');
    }
    for (const name of ['甲批.', 'α解。', '_批.', '解说', '批注']) has(name, name.slice(0, -1), 'variable.other.ru');
    has('批 . 显 1.', '批', 'variable.other.ru');
    assert.deepEqual(require('../language-configuration.json').comments, { lineComment: '批.', blockComment: ['解.', '释.'] });
});
test('完 is a whole statement keyword, never a block delimiter', () => {
    const config = require('../language-configuration.json');
    for (const dot of ['.', '。']) {
        has(`完${dot}`, '完', 'keyword.control.ru');
        assert.ok(!new RegExp(config.indentationRules.decreaseIndentPattern).test(`完${dot}`));
        assert.ok(!new RegExp(config.indentationRules.increaseIndentPattern).test(`完${dot}`));
        for (const prefix of ['# ', '// ', '批. ', '批。 ']) has(prefix + `完${dot}`, '完', 'comment.line.ru');
        has(`解. 完${dot} 释.`, '完', 'comment.block.ru');
        for (const [a, z] of [["'", "'"], ['"', '"'], ['‘', '’'], ['“', '”']]) has(a + `完${dot}` + z, '完', 'string.quoted.ru');
    }
    for (const id of ['完成', '完2', '未完', '_完', 'α完', '𠀀完', '完²']) has(id, id, 'variable.other.ru');
    has('得 1.', '得', 'keyword.control.ru');
    const snippet = require('../snippets/ru.json')['过程提前结束'];
    assert.deepEqual(snippet.body, ['完.', '$0']);
});
test('RU008 optional and mixed declaration parameters keep names distinct from anonymous parameters', () => {
    for (const header of ['算 原样 值:', '作 原样 值:', '    算 原样 值, 次数 为 数:', '算 原样 值 次数 为 数：', '算 原样 值 为 数, 次数:', '算 原样 值，次数 为 数:']) {
        has(header, '原样', 'entity.name.function.ru');
        has(header, '值', 'variable.other.ru');
    }
    for (const source of ['回调 取 算 值: 得 值. 法.', '回调 取 作 值: 显 值. 为.', '回调 取 算 值 次数 为 数: 得 值. 法.', '显 (算 值: 得 值. 法) 空.', '回调 取 算 值 为 数: 得 值. 法.']) {
        has(source, '值', 'variable.other.ru');
        assert.ok(!scopes(source, source.indexOf('值')).includes('entity.name.function.ru'));
    }
    const increase = new RegExp(require('../language-configuration.json').indentationRules.increaseIndentPattern);
    for (const line of ['算 原样 值:', '作 原样 值:', '回调 取 算 值:', '回调 取 作 值:', '算 选择 值, 次数 为 数:']) assert.ok(increase.test(line), line);
});
test('facts and map delimiters use whole identifiers and preserve comments and nested functions', () => {
    for (const word of ['真', '假']) has(`显 ${word}.`, word, 'constant.language.ru');
    has('算 判断 值 为 事实:', '事实', 'storage.type.ru');
    has('算 查询 表 为 典:', '典', 'storage.type.ru');
    for (const word of ['典', '成']) has('表 取 典: ‘上’ 对 0. 成.', word, 'keyword.control.ru');
    for (const id of ['字典', '完成', '典藏', '成2', 'α成', '𠀀成', '事实值', '真假', '真实', '假²']) has(id, id, 'variable.other.ru');
    for (const word of ['增', '除', '列', '同', '印']) has(`表 其 ${word}.`, word, 'variable.other.ru');
    has('表 取 典: ‘成’ 对 算 值: 得 值. 法. 成.', '值', 'variable.other.ru');
    has('表 取 典: ‘成’ 对 作 值: 完. 为. 成.', '完', 'keyword.control.ru');
    for (const line of ['# 典 成 真 假 事实', '批. 典 成 真 假 事实', '解. 典 成 真 假 事实 释.']) {
        for (const word of ['典', '成', '真', '假', '事实']) assert.ok(scopes(line, line.indexOf(word)).some(x => x.startsWith('comment.')));
    }
    for (const [a,z] of [["'","'"], ['"','"'], ['‘','’'], ['“','”']]) {
        for (const word of ['典','成','真','假','事实']) has(`${a}${word}${z}`,word,'string.quoted.ru');
    }
});
test('maps have paired block indentation without matching completion identifiers', () => {
    const config = require('../language-configuration.json');
    const increase = new RegExp(config.indentationRules.increaseIndentPattern);
    const decrease = new RegExp(config.indentationRules.decreaseIndentPattern);
    for (const line of ['典:', '典：', '表 取 典:', '    表 取 典：']) assert.ok(increase.test(line), line);
    for (const line of ['字典:', '完成:', '典: 成.', "表 取 ‘典:’", '批. 典:', '# 典:']) assert.ok(!increase.test(line),line);
    for (const line of ['成', '成.', '成。', '    成)']) assert.ok(decrease.test(line),line);
    for (const line of ['完成', '成果.', '成2.', '完.']) assert.ok(!decrease.test(line),line);
    assert.ok(!config.brackets.some(([a]) => a==='典'), 'type annotations must not be mistaken for block openers');
    const rule = config.onEnterRules[0];
    for (const line of ['典:', '表 取 典:']) assert.ok(new RegExp(rule.beforeText).test(line));
    for (const line of ['字典:', 'α典:', '𠀀典:']) assert.ok(!new RegExp(rule.beforeText).test(line));
    assert.ok(new RegExp(rule.afterText).test('成.'));
    assert.ok(!new RegExp(rule.afterText).test('成果.'));
    assert.equal(rule.action.indent,'indentOutdent');
});

test('map grammar nests and never closes on 成 inside 完成, strings, comments or type names', () => {
    let stack = grammar.tokenizeLine('表 取 典:').ruleStack;
    for (const line of ["‘完成’ 对 典:", '完成 对 真.', '批. 成', '解. 成 释.', "‘成’ 对 假."]) {
        const result = grammar.tokenizeLine(line, stack); stack = result.ruleStack;
        assert.ok(result.tokens.some(t => t.scopes.includes('meta.map.ru')),line);
    }
    stack = grammar.tokenizeLine('成.',stack).ruleStack;
    assert.ok(scopes('完成 对 真.',0,stack).includes('meta.map.ru'));
    stack = grammar.tokenizeLine('成.',stack).ruleStack;
    assert.ok(!scopes('显 真.',0,stack).includes('meta.map.ru'));
    stack = grammar.tokenizeLine('算 查询 表 为 典:').ruleStack;
    assert.ok(!scopes('显 真.',0,stack).includes('meta.map.ru'));
});

test('symbol dictionaries nest with word dictionaries and preserve strings, comments and closures', () => {
    for (const line of ["表 取 {'心': 0, '意': 1}.", '表 取 ｛‘心’：0，‘意’：1，｝.']) {
        has(line, line.includes('{') ? '{' : '｛', 'punctuation.section.brackets.ru');
        has(line, '0', 'constant.numeric.ru');
        has(line, line.includes('}') ? '}' : '｝', 'punctuation.section.brackets.ru');
    }
    let stack = grammar.tokenizeLine("表 取 {'外': 典:").ruleStack;
    stack = grammar.tokenizeLine("'内' 对 {'闭包': 算 值: 得 值. 法, '成': '}' }.", stack).ruleStack;
    stack = grammar.tokenizeLine('批. } 成', stack).ruleStack;
    assert.ok(scopes('完成',0,stack).includes('meta.map.ru'));
    stack = grammar.tokenizeLine('成}',stack).ruleStack;
    assert.ok(!scopes('显 真.',0,stack).some(s => ['meta.braces.ru','meta.map.ru'].includes(s)));
    for (const line of ["'{成}'", '‘｛成｝’', '# {成}', '批. ｛成｝', '解. {成} 释.']) {
        assert.ok(!grammar.tokenizeLine(line).tokens.some(t => t.scopes.includes('meta.braces.ru')),line);
    }
});
test('symbol delimiters pair conservatively without changing word blocks', () => {
    const c = require('../language-configuration.json');
    const inc = new RegExp(c.indentationRules.increaseIndentPattern);
    const dec = new RegExp(c.indentationRules.decreaseIndentPattern);
    for (const [a,z] of [['{','}'], ['｛','｝']]) {
        assert.ok(c.brackets.some(p => p[0]===a && p[1]===z));
        assert.ok(c.surroundingPairs.some(p => p[0]===a && p[1]===z));
        assert.deepEqual(c.autoClosingPairs.find(p => p.open===a), {open:a,close:z,notIn:['string','comment']});
        assert.ok(inc.test(`表 取 ${a}`));
        assert.ok(dec.test(`    ${z}.`));
        assert.ok(!inc.test(`表 取 ${a}${z}.`));
        for (const line of [`# ${a}`, `批. ${a}`, `'${a}'`]) assert.ok(!inc.test(line),line);
    }
    assert.ok(inc.test('若 真 则')); assert.ok(dec.test('然'));
});
test('scoped word blocks preserve contextual names and nested lexical states', () => {
    for (const id of ['段落','落叶','段2','α段','𠀀落']) has(id,id,'variable.other.ru');
    for (const line of ['列 其 段 始:0 终:2.', '段 取 1.', '落 取 2.']) {
        for (const token of grammar.tokenizeLine(line).tokens) assert.ok(!token.scopes.includes('meta.scope.ru'),line);
    }
    let stack = grammar.tokenizeLine('段:').ruleStack;
    assert.ok(scopes('值 取 1.',0,stack).includes('meta.scope.ru'));
    for (const line of ["显 '落.'.", '批. 落.', '解. 落. 释.', '落叶 取 1.', '落 取 2.', '列 其 落.']) {
        stack = grammar.tokenizeLine(line,stack).ruleStack;
        assert.ok(scopes('显 值.',0,stack).includes('meta.scope.ru'),line);
    }
    stack = grammar.tokenizeLine('段：',stack).ruleStack;
    stack = grammar.tokenizeLine('落。',stack).ruleStack;
    assert.ok(scopes('显 值.',0,stack).includes('meta.scope.ru'));
    stack = grammar.tokenizeLine('落.',stack).ruleStack;
    assert.ok(!scopes('显 值.',0,stack).includes('meta.scope.ru'));
    has('段:', '段', 'keyword.control.ru');
    has('列 其 段 始:0.', '段', 'variable.other.ru');
});
test('scoped indentation and snippet boundaries are conservative', () => {
    const c=require('../language-configuration.json');
    const inc=new RegExp(c.indentationRules.increaseIndentPattern),dec=new RegExp(c.indentationRules.decreaseIndentPattern);
    for(const line of ['段:', ' 段：', '段: 批. 内容', '{', '｛']) assert.ok(inc.test(line),line);
    for(const line of ['段落:', '其 段:', '段 取 1.', '落 取 2.', '落叶.', '批. 段:']) assert.ok(!inc.test(line)&&!dec.test(line),line);
    for(const line of ['落.', ' 落。', '}','｝']) assert.ok(dec.test(line),line);
    const rule=c.onEnterRules.find(r=>r.beforeText.includes('段'));
    assert.ok(new RegExp(rule.beforeText).test('段:'));
    assert.ok(new RegExp(rule.afterText).test('落.'));
    assert.ok(!new RegExp(rule.afterText).test('落叶.'));
    assert.equal(require('../snippets/ru.json')['作用域段'].body.at(-2),'落.');
});
test('assignment aliases stay distinct from map fields, named arguments and block colons', () => {
    for(const op of [':=','：=']) has(`值 ${op} 1.`,op,'keyword.operator.assignment.ru');
    for(const line of ["表 取 {'心': 0}.", '函数 名:1.', '段:', '值 : = 1.']) assert.ok(!grammar.tokenizeLine(line).tokens.some(t=>t.scopes.includes('keyword.operator.assignment.ru')),line);
    for(const line of ['# :=','批. ：=','解. := 释.', '“:=”']) assert.ok(!grammar.tokenizeLine(line).tokens.some(t=>t.scopes.includes('keyword.operator.assignment.ru')),line);
});
test('practical members have contextual coloring, ordinary exports never become keywords', () => {
    for (const word of ['删','弹','查']) {
        has(`列 其 ${word}.`,word,'support.function.member.ru');
        for (const text of [word, `${word} 取 1.`, `其他 ${word}.`, `其 ${word}值.`, `𠀀其 ${word}.`]) has(text,word,'variable.other.ru');
        for (const line of [`# 其 ${word}.`, `批. 其 ${word}.`, `解. 其 ${word}. 释.`, `'其 ${word}.'`]) assert.ok(!scopes(line,line.indexOf(word)).includes('support.function.member.ru'));
    }
    for (const word of ['拆分','替换','去空白','定点','平方根','幂','取整','向下取整','向上取整','四舍五入','造源','整数','洗牌']) {
        has(`${word} 取 1.`,word,'variable.other.ru');
        has(`模块 其 ${word}.`,word,'variable.other.ru');
    }
});
