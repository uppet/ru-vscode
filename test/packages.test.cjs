const { test } = require('node:test');
const assert = require('node:assert/strict');
const { packageTokens, packageHoverAt, isPackageManifest } = require('../out/packages');
const { hoverAt } = require('../out/hover');
const marked = source => packageTokens(source).map(t => [source.slice(t.start, t.end), t.type]);
test('complete module declarations recognize Unicode chains, both dots and comment gaps', () => {
    for (const dot of ['.', '。']) for (const gap of [' ', '\n', '\t', ' 解. anything 释. ', ' # comment\n', ' // comment\n', ' 批。comment\n']) {
        const source = `吾${gap}言${gap}工程${gap}其${gap}𠀀模块${dot}`;
        assert.deepEqual(marked(source), [['吾','keyword'],['言','keyword'],['工程','namespace'],['其','keyword'],['𠀀模块','namespace']]);
        for (const word of ['吾','言','工程','𠀀模块']) assert.match(hoverAt(source,source.indexOf(word)).text,/仅模块顶层一次/);
    }
});
test('ordinary names, call escape, nested declarations and incomplete input are not package declarations', () => {
    for (const source of ['吾 取 1. 言 取 2. 显 吾 + 言.', '算 吾 言: 得 言. 法.', '吾 (言) 工程.', '吾 言 工程', '吾 言 工程 其.', '吾 言 工程 其 算.', '3吾 言 工程.', '𠀀吾 言 工程.', '吾 言语 工程.', '显 吾 言 工程.', '算 f: 吾 言 工程. 法.', '作 f: 吾 言 工程. 为.', '形 f: 吾 言 工程. 象.', '若 真 则 吾 言 工程. 然.', '循 2 次 吾 言 工程. 环.', '段: 吾 言 工程. 落.', '{ 吾 言 工程. }.', '(吾 言 工程.)']) {
        assert.deepEqual(marked(source),[],source);
    }
    assert.deepEqual(marked('算 f 参数 为 数: 得 参数. 法. 吾 言 工程.'), [['吾','keyword'],['言','keyword'],['工程','namespace']]);
    assert.equal(packageTokens('吾 言 工程. 吾 言 工程.').length,6,'duplicate validation belongs to compiler');
});
test('strings and all comments shield apparent module syntax', () => {
    for (const source of ["'吾 言 工程. 外言 工程 其 排序'", "'吾' 言 工程.", "吾 '言' 工程.", "'吾' '言' 工程.", "'.' 吾 言 工程.", '“吾 言 工程.”', '‘外言 工程 其 缓存’', '"https://example.org/吾 言 工程."', '# 吾 言 工程.', '// 外言 工程', '批. 吾 言 工程.', '解。吾 言 工程. 外言 工程 其 量.释。', '# only', '解. unfinished']) assert.deepEqual(marked(source),[],source);
    assert.equal(packageTokens("显 '段': 1. 吾 言 工程.").length,3,'string contents cannot create nesting');
});
test('try and rescue close at contextual 终, while 卒 never closes the block', () => {
    for(const dot of ['.','。']) {
        const source=`试: 卒 '失败'${dot} 救 原因: 显 原因${dot} 终${dot} 吾 言 工程 其 力学${dot}`;
        assert.deepEqual(marked(source),[['吾','keyword'],['言','keyword'],['工程','namespace'],['其','keyword'],['力学','namespace']]);
        const nested=`试: 卒 '失败'${dot} 吾 言 错误${dot} 救 原因: 吾 言 错误${dot} 终${dot}`;
        assert.deepEqual(marked(nested),[]);
        assert.deepEqual(marked(`试: 显 对象 其 终${dot} 吾 言 错误${dot} 救 原因: 显 终${dot} 吾 言 错误${dot} 终${dot}`),[],'a member/value named 终 does not close the try');
        assert.equal(packageTokens(`试: 救 原因: 终${dot} 吾 言 工程${dot}`).length,3,'empty rescue');
    }
});
test('static module segments exclude actual reserved words but preserve contextual names', () => {
    const words='显 取 为 得 完 破 若 则 另 然 循 次 环 算 作 法 其 且 或 非 空 真 假 典 成 对 形 象 如 新 外言 尽取 尽 试 救 卒'.split(' ');
    for(const word of words) {
        assert.deepEqual(marked(`吾 言 工程 其 ${word}.`),[],word);
        const source=`外言 工程 其 ${word}.`;
        assert.ok(!packageTokens(source).some(t=>t.type==='namespace' && source.slice(t.start,t.end)===word),word);
    }
    for(const word of ['终','段','落','吾','言']) assert.ok(marked(`吾 言 工程 其 ${word}.`).some(([name,type])=>name===word && type==='namespace'),word);
});
test('whole named import chain is static and suppresses ordinary member help', () => {
    for (const gap of [' ', '\n', ' 解. comment 释. ', ' # comment\n']) {
        const source = `力 取 外言${gap}物理${gap}其${gap}段${gap}其${gap}排序${gap}其${gap}量.`;
        assert.deepEqual(marked(source), [['外言','keyword'],['物理','namespace'],['其','keyword'],['段','namespace'],['其','keyword'],['排序','namespace'],['其','keyword'],['量','namespace']]);
        for (const word of ['段','排序','量']) assert.match(hoverAt(source, source.indexOf(word)).text,/整条其链属于静态名字/);
    }
    const grouped = '显 (外言 物理 其 力学) 其 排序.';
    assert.match(hoverAt(grouped,grouped.indexOf('排序')).text,/内置阵/);
    const stringImport = "力 取 外言 '如:数学'.";
    assert.deepEqual(marked(stringImport),[]);
    assert.match(hoverAt("密 取 外言 '如:密'.",9).text,/Windows x64/);
    for (const source of ['外言工程 其 排序.', '3外言 工程.', '外言 算.', '外言', '外言 # comment']) assert.deepEqual(marked(source),[],source);
});
test('manifest help is filename-aware, static, and never mistakes values or comments for keys', () => {
    for (const file of ['/project/集录.ru', 'C:\\中文\\集录.ru', '集录.ru']) assert.equal(isPackageManifest(file),true);
    for (const file of ['/project/集录.ru.bak','/project/非集录.ru','/project/集录.ru/file.ru']) assert.equal(isPackageManifest(file),false);
    for (const key of ['名','版','需如言','源码根','公开','依赖','路径','Git','引用','子目录','目录','包']) {
        const source = `典: '${key}' 对 'value'. 成.`;
        assert.match(packageHoverAt(source,5,'/project/集录.ru').text,/静态包清单/);
        assert.equal(packageHoverAt(source,5,'/project/code.ru'),undefined);
    }
    for (const source of ["典: '名' 对 '公开'. 成.","# '公开' 对 []", "解. '公开' 对 [] 释."]) assert.equal(packageHoverAt(source,source.indexOf('公开'),'集录.ru'),undefined,source);
    const pathText=packageHoverAt("典: '路径' 对 '/absolute'. 成.",5,'集录.ru').text;
    for(const phrase of ['当前宿主显式绝对目录','不可搬迁','拒绝异平台盘符']) assert.ok(pathText.includes(phrase),phrase);
    const text=packageHoverAt("典: '公开' 对 []. 成.",5,'集录.ru').text;
    for(const phrase of ['相对源码根','相对包根','三选一','不是 schema 验证','ru deps sync','不要运行','--locked','--update','锁字节不变','RU_PACKAGE_CACHE','不可搬迁']) assert.ok(text.includes(phrase),phrase);
});
test('package snippet defaults and versions preserve full-stop style and static data boundary', () => {
    const snippets = require('../snippets/ru.json');
    for(const name of ['具名模块声明','具名模块导入','具名全量导入','静态包清单']) assert.ok(snippets[name].description.includes('静态') || snippets[name].description.includes('Ru 0.22.0'));
    assert.equal(snippets['具名全量导入'].body[0].startsWith('尽取 外言'),true);
    assert.equal(snippets['具名模块声明'].body[0].endsWith('.'),true);
    const config=require('../language-configuration.json');
    assert.equal(new RegExp(config.indentationRules.increaseIndentPattern).test('吾 言 工程 其 力学.'),false);
});
