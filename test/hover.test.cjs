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
test('fact and map hover explains changed semantics and ordinary method contracts', () => {
    for (const word of ['事实','真','假','典','成']) assert.ok(hoverAt(word,0)?.text.includes('0.10.0'));
    const facts = hoverAt('事实',0).text;
    for (const term of ['只有空、假','0、空句、空阵和空典','独立类型','短路']) assert.ok(facts.includes(term));
    const map = hoverAt('典',0).text;
    for (const term of ['普通方法名','无序快照','返回事实','安全整数','相同印值','查 目','增 目 相','除 目','0.12.1','逐目的参数名仍为回调']) assert.ok(map.includes(term));
    for (const word of ['查','增','除','列','同','印']) assert.equal(hoverAt(word,0),undefined);
    for (const source of ['完成','事实值','字典','真假','𠀀成','# 成','批. 真','解. 假 释.', '‘典’']) {
        for (let i=0;i<source.length;i++) assert.equal(hoverAt(source,i),undefined,source);
    }
});
test('scope hover describes local writes and excludes member names and ordinary bindings', () => {
    const text=hoverAt('段:',0).text;
    for(const phrase of ['直接取只写当前块','闭包','得、完、破','表达式位置']) assert.ok(text.includes(phrase),phrase);
    assert.ok(hoverAt('落.',0).text.includes('上下文'));
    assert.ok(hoverAt('值 取 1.',2).text.includes('块正文的直接取只写本层'));
    for(const source of ['其 段 始:0.', '其 段:0.', '其 落.', '段 取 1.', '落 取 1.', '段落:', '落叶.', '# 段:', '批. 落.', '“段:”']) {
        const i=Math.max(source.indexOf('段'),source.indexOf('落'));
        assert.equal(hoverAt(source,i),undefined,source);
    }
});
test('assignment aliases expose assignment rules only outside strings and comments', () => {
    for(const op of [':=','：=']) for(const pos of [2,3]) assert.ok(hoverAt(`值 ${op} 1.`,pos)?.text.includes('只写本层'));
    for(const text of ["' :='",'批. :=','解. ：= 释.','# :=','值 : = 1.']) assert.equal(hoverAt(text,text.indexOf(':')<0?text.indexOf('：'):text.indexOf(':')),undefined,text);
});
test('practical member hover is contextual and distinguishes array from dictionary lookup', () => {
    for (const word of ['删','弹','查']) {
        for (const gap of [' ', '\t', '\n']) {
            const source = `列 其${gap}${word}.`;
            assert.ok(hoverAt(source, source.indexOf(word))?.text.includes('0.12.0'));
        }
        for (const source of [word, `${word} 取 1.`, `其他 ${word}.`, `𠀀其 ${word}.`, `其 ${word}值.`, `其 2 ${word}.`, `其 '${word}'.`, `# 其 ${word}`, `解. 其 ${word} 释.`, `# 其\n${word}.`, `其 '文字' ${word}.`]) assert.equal(hoverAt(source,source.lastIndexOf(word)),undefined,source);
    }
    const lookup=hoverAt('列 其 查 值:1.',4).text;
    for (const text of ['零起点位置','浅元素快照','目:目标','不判断接收者类型']) assert.ok(lookup.includes(text));
    assert.ok(hoverAt('列 其 弹.',4).text.includes('不写()'));
    for (const word of ['拆分','替换','去空白','定点','平方根','幂','取整','向下取整','向上取整','四舍五入','造源','整数','洗牌']) assert.equal(hoverAt(`模块 其 ${word}.`,5),undefined,word);
});

test('dictionary named parameters and array value parameters stay distinct', () => {
    const lookup = hoverAt('表 其 查 目:1.', 4).text;
    assert.ok(lookup.includes('阵 其 查 值:目标.'));
    assert.ok(lookup.includes('典 其 查 目:目标.'));
    assert.ok(!lookup.includes('键:'));
    const snippets = require('../snippets/ru.json');
    assert.ok(snippets['典逐目回调'].body.join('\n').includes('${2:目}, ${3:相}'));
    for (const term of ['查 目:', '增 目:', '相:', '除 目:']) assert.ok(snippets['典命名参数'].body.join('\n').includes(term));
    assert.ok(snippets['阵删弹查'].body.join('\n').includes('查 值:'));
});

test('module import hover explains canonical names and notebook-only graphics', () => {
    const help = hoverAt("尽 取 外言 '如:观'.", 4).text;
    for (const word of ['如竞、如观、如:竞赛', "外言 '如:竞'", "外言 '如:观'", '如书 Python', '普通 CLI', 'C / Node.js', 'browser-js', '无兼容别名']) assert.ok(help.includes(word), word);
    for (const text of ["'外言'", '# 外言', '外言者']) assert.equal(hoverAt(text, text.indexOf('外言')), undefined);
    const snippets = require('../snippets/ru.json');
    assert.ok(snippets['竞赛模板'].body[0].includes("'如:竞'"));
    for (const name of ['如观绘图', '如观动画交互']) {
        assert.ok(snippets[name].body[0].includes("'如:观'"));
        assert.ok(snippets[name].description.includes('如书 Python / browser-js'));
    }
});


test('array sort and map hints are contextual and describe distinct callbacks', () => {
    for (const word of ['排序','另成']) {
        assert.equal(hoverAt(`${word} 取 1.`, 0), undefined);
        for (const source of [`# 其 ${word}.`, `'其 ${word}.'`, `批. 其 ${word}.`, `解. 其 ${word}. 释.`])
            assert.equal(hoverAt(source, source.indexOf(word)), undefined);
        assert.match(hoverAt(`列 其 ${word}.`,4).text, /新阵|新浅复制阵/);
    }
    assert.match(hoverAt('列 其 排序.',4).text, /先于:二参算/);
    assert.match(hoverAt('列 其 另成.',4).text, /不接受作/);
    const snippets=require('../snippets/ru.json');
    assert.ok(snippets['阵排序另成'].body.join('\n').includes('算法:'));
});


test('traversal hints preserve callback and migration contracts', () => {
    assert.match(hoverAt('列 其 逐位.',4).text, /位、值/);
    assert.match(hoverAt('表 其 逐目.',4).text, /目、相/);
    assert.match(hoverAt('表 其 逐目.',4).text, /旧典列已移除/);
    for (const word of ['逐位','逐目']) {
        assert.equal(hoverAt(`${word} 取 1.`,0),undefined);
        for(const source of [`# 其 ${word}.`, `'其 ${word}.'`, `批. 其 ${word}.`, `解. 其 ${word}. 释.`])
            assert.equal(hoverAt(source,source.indexOf(word)),undefined);
    }
});

test('graphics member hover stays contextual and states host and state contracts', () => {
    for (const word of ["三角形", "多边形", "平移", "旋转", "缩放", "保存", "恢复", "变换", "重置变换", "裁剪", "取消裁剪"]) {
        for (const gap of [' ', '\t', '\n']) {
            const source = `图 其${gap}${word}.`;
            const text = hoverAt(source, source.indexOf(word))?.text;
            assert.match(text, /Ru 0.19.0／如书 0.8.0/);
            assert.match(text, /Python \/ browser-js/);
            assert.match(text, /不判断接收者类型/);
        }
        for (const source of [word, `${word} 取 1.`, `其他 ${word}.`, `𠀀其 ${word}.`, `其 ${word}值.`, `其 2 ${word}.`, `其 '${word}'.`, `# 其 ${word}`, `批. 其 ${word}`, `解. 其 ${word} 释.`])
            assert.equal(hoverAt(source, source.lastIndexOf(word)), undefined, source);
    }
    for (const [word, phrases] of Object.entries({多边形:['3～256','nonzero'],变换:['右乘','a*x+c*y+e'],缩放:['零与负倍率'],保存:['64层','不自动恢复'],恢复:['空栈','关闭交互'],裁剪:['32个','交集','快照'],重置变换:['不改变已有裁剪'],取消裁剪:['不改变当前矩阵']})) {
        const source = `图 其 ${word}.`;
        for (const phrase of phrases) assert.ok(hoverAt(source,4).text.includes(phrase), `${word}: ${phrase}`);
    }
});
