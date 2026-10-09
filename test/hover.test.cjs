const { test } = require('node:test');
const assert = require('node:assert/strict');
const { hoverAt } = require('../out/hover');
test('hover describes rules without claiming a resolved binding', () => {
    for (const word of ['取', '算', '作', '形']) assert.ok(hoverAt(`值 ${word} 值`, 2));
    const text = hoverAt('值 取 1.', 2).text;
    for (const term of ['非模块', '救块', '不是对此处绑定归属']) assert.ok(text.includes(term));
});
test('hover excludes comments, strings, larger Unicode identifiers and non-BMP boundaries', () => {
    for (const source of ['# 取', '// 取', '批. 取', '批。 取', '解.\n取\n释.', '解。"取"释。', "'取'", '“取”', "'x\\'取'", '获取', '取值', 'α取', '𠀀取', '3取']) assert.equal(hoverAt(source, source.indexOf('取')), undefined, source);
    for (const source of ['批 . 取', '甲批. 取', '𠀀批. 取', '解. 解. 甲释. 取', "'取'\n取", '解。\n释。 取']) assert.ok(hoverAt(source, source.lastIndexOf('取')), source);
});
test('procedure finish help states version, result and scope without semantic claims', () => {
    for (const dot of ['.', '。']) {
        const text = hoverAt(`完${dot}`, 0).text;
        for (const term of ['0.8.0', '返回空', '不带表达式', '不是块结束符', '嵌套的算', '不判断']) assert.ok(text.includes(term), term);
    }
    assert.ok(hoverAt('作', 0).text.includes('不再返回空句'));
    for (const source of ['完成', '未完', 'α完', '𠀀完', '3完', '完²', '# 完.', '// 完。', '批. 完.', '解。完。释。', "'完.'", '"完."', '‘完。’', '“完。”']) {
        assert.equal(hoverAt(source, source.indexOf('完')), undefined, source);
    }
});
test('RU008 hover explains optional declaration types without changing call or arity rules', () => {
    for (const word of ['算', '作']) {
        const text = hoverAt(word, 0).text;
        for (const term of ['0.9.0', '含空', '仍必传', '显式类型仍检查', '空白或逗号', '调用实参混用']) assert.ok(text.includes(term), term);
    }
});
