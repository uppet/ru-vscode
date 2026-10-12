const { test } = require('node:test');
const assert = require('node:assert/strict');
const matcher = require('../package.json').contributes.problemMatchers.find(m => m.name === 'ru');
const parse = line => new RegExp(matcher.pattern.regexp).exec(line);
test('Ru task matcher recognizes real paths without truncating Windows drive, spaces or Unicode', () => {
    for (const file of ['C:\\中文 目录\\题目.ru', '/tmp/中文 目录/😀题.ru', 'C:/空 格/题.ru']) {
        for (const prefix of ['error: ', '']) {
            const match = parse(`${file}:12:3: ${prefix}运行错误：未定义`);
            assert.equal(match[matcher.pattern.file], file);
            assert.equal(match[matcher.pattern.line], '12');
            assert.equal(match[matcher.pattern.message], '运行错误：未定义');
        }
    }
});
test('codepoint columns stay in terminal text; matcher deliberately promises only line navigation', () => {
    assert.equal(matcher.pattern.column, undefined);
    assert.equal(matcher.pattern.endColumn, undefined);
    assert.equal(matcher.fileLocation, 'absolute');
    assert.equal(matcher.severity, 'error');
    for (const col of [1, 3, 19]) assert.ok(parse(`/tmp/😀.ru:2:${col}: error: 语法错误：测试`));
});
test('virtual notebook sources and non-diagnostics never become filesystem Problems', () => {
    for (const line of ['rushu://会话/1/cell/2.ru:1:1: error: 错误', '<如书 cell>:1:1: error: 错误',
        '已生成程序', '/tmp/题.ru:0: error: 错误', '/tmp/题.ru:1:0: error: 错误']) assert.equal(parse(line), null);
});

test('line-only C diagnostics retain whole Windows and colon-containing paths', () => {
    for (const file of ['C:\\中文 目录\\题.ru', '/tmp/中文:片段 文件.ru']) {
        for (const location of ['12', '12:3']) {
            for (const prefix of ['error: ', '']) {
                const match = parse(`${file}:${location}: ${prefix}运行错误：测试`);
                assert.equal(match[matcher.pattern.file], file);
                assert.equal(match[matcher.pattern.line], '12');
                assert.equal(match[matcher.pattern.message], '运行错误：测试');
            }
        }
    }
});
