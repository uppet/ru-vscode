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
    const help = hoverAt("尽取 外言 '如:观'.", 3).text;
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


test('alpha, alignment and timing hover preserve ordinary identifiers and lexical boundaries', () => {
    const versions = {'颜色': '0.19.1', '文字对齐': '0.19.2', '经过秒': '0.19.3', '间隔秒': '0.19.3'};
    for (const [word, version] of Object.entries(versions)) {
        for (const gap of [' ', '\t', '\n']) {
            const source = `图 其${gap}${word}.`;
            const text = hoverAt(source, source.indexOf(word))?.text;
            for (const phrase of [version, 'Python', 'browser-js', '不判断接收者类型']) assert.ok(text?.includes(phrase), `${word}: ${phrase}`);
        }
        for (const source of [word, `${word} 取 1.`, `其他 ${word}.`, `𠀀其 ${word}.`, `其 ${word}值.`, `其 ${word}².`, `其 2 ${word}.`, `其 '${word}'.`, `# 其 ${word}`, `批. 其 ${word}`, `解. 其 ${word} 释.`, `其 '文字' ${word}.`, `其 # 注释\n${word}.`])
            assert.equal(hoverAt(source, source.lastIndexOf(word)), undefined, source);
    }
});

test('graphics color, text and clock help states exact versions and contracts', () => {
    const expected = {
        '颜色': ['四参均必需', '0～255', '#rrggbbaa', '不钳位', '红:', '绿:', '蓝:', '不透明度:', '不是画布成员', 'Python CLI 可单独调用', '#RRGGBB 或 #RRGGBBAA'],
        '文字对齐': ['两参均必需', "'左'／'中'／'右'", "'上'／'中'／'下'／'基线'", '横向:', '纵向:', 'em框', '跨回调', '保存／恢复', '背景不重置', '不移动旧文字'],
        '经过秒': ['只读', '零参数', '初值0', '单位秒', '暂停或隐藏', '单调', '快照', '冻结', '帧序号一个参数'],
        '间隔秒': ['只读', '零参数', '初帧', '首帧为0', '输入回调内为0', '不改动上一帧时间', '重绑', '不截断、不补帧', '自行限制步长']
    };
    for (const [word, phrases] of Object.entries(expected)) {
        const text = hoverAt(`图 其 ${word}.`, 4).text;
        for (const phrase of phrases) assert.ok(text.includes(phrase), `${word}: ${phrase}`);
    }
    assert.ok(hoverAt("外言 '如:观'.", 0).text.includes('#RRGGBB 或 #RRGGBBAA'));
    assert.ok(hoverAt('图 其 保存.', 4).text.includes('文字对齐'));
});

test('path members stay contextual across whitespace, Unicode, strings and comments', () => {
    const versions = {弧:'0.19.4', 扇形:'0.19.4', 折线:'0.19.5', 贝塞尔:'0.19.6'};
    for (const [word, version] of Object.entries(versions)) {
        for (const gap of [' ', '\t', '\n']) {
            const source = `图 其${gap}${word}.`;
            const text = hoverAt(source, source.indexOf(word))?.text;
            for (const phrase of [version, 'Python / browser-js', '普通 CLI／check', '不判断接收者类型', '返回空'])
                assert.ok(text?.includes(phrase), `${word}: ${phrase}`);
        }
        for (const source of [word, `${word} 取 1.`, `其他 ${word}.`, `𠀀其 ${word}.`, `其 ${word}值.`, `其 ${word}².`, `其 2 ${word}.`, `其 '${word}'.`, `# 其 ${word}`, `// 其 ${word}`, `批. 其 ${word}`, `解. 其 ${word} 释.`, `其 '文字' ${word}.`, `其 # 注释\n${word}.`])
            assert.equal(hoverAt(source, source.lastIndexOf(word)), undefined, source);
        for (const [open, close] of [["'", "'"], ['"', '"'], ['‘', '’'], ['“', '”']]) {
            const source = `${open}其 ${word}${close}`;
            assert.equal(hoverAt(source, source.indexOf(word)), undefined, source);
        }
    }
});

test('path hover states exact signatures, open paths, sweep and control-point contracts', () => {
    const expected = {
        弧:['六参均必需', '横:', '纵:', '宽:', '高:', '始角:', '转角:', '不混用', '外接框左上角', '宽高非负', '100000', '弧度', '不是终止角', '顺时针', '逆时针', '参数角', '只描边', '忽略填色', '转角0', '>= 2π', '不取模归零'],
        扇形:['六参均必需', '横:', '纵:', '宽:', '高:', '始角:', '转角:', '不混用', '弧度', '两条半径边', 'nonzero', '>= 2π', '无中心辐条', '转角0', '冻结'],
        折线:['唯一参数必需', '点阵:', '2～256', '恰含两个', '100000', '只描边一次', '不自动首尾闭合', '忽略且不修改填色', '深复制', '描边 空', '帧预算不变'],
        贝塞尔:['八参均必需', '起横:', '起纵:', '控一横:', '控一纵:', '控二横:', '控二纵:', '终横:', '终纵:', '不混用', '100000', '原生三次', '非必过点', '只描边一次', '不自动闭合', '忽略且不修改填色', '描边 空', '帧预算不变']
    };
    for (const [word, phrases] of Object.entries(expected)) {
        const text = hoverAt(`图 其 ${word}.`, 4).text;
        for (const phrase of phrases) assert.ok(text.includes(phrase), `${word}: ${phrase}`);
    }
    const snippets = require('../snippets/ru.json');
    for (const name of ['如观弧与扇形', '如观折线', '如观贝塞尔']) {
        const source = snippets[name].body.join('\n');
        assert.match(source, /观 取 外言 '如:观'/);
        assert.match(source, /图 取 观 其 画布/);
        assert.match(snippets[name].description, /如书 Python \/ browser-js/);
        assert.match(snippets[name].description, /CLI 不支持画布/);
    }
    for (const member of Object.keys(expected)) assert.ok(hoverAt('外言', 0).text.includes(member));
});

test('cache members stay contextual across whitespace, Unicode, strings and comments', () => {
    const versions = {缓存:'0.19.8', 贴图:'0.19.8', 宽:'0.19.8', 高:'0.19.8'};
    for (const [word, version] of Object.entries(versions)) {
        for (const gap of [' ', '\t', '\n']) {
            const source = `图 其${gap}${word}.`;
            const text = hoverAt(source, source.indexOf(word))?.text;
            for (const phrase of [version, 'Python / browser-js', '普通 CLI／check', '不判断接收者类型'])
                assert.ok(text?.includes(phrase), `${word}: ${phrase}`);
        }
        for (const source of [word, `${word} 取 1.`, `其他 ${word}.`, `𠀀其 ${word}.`, `其 ${word}值.`, `其 ${word}².`, `其 2 ${word}.`, `其 '${word}'.`, `# 其 ${word}`, `// 其 ${word}`, `批. 其 ${word}`, `解. 其 ${word} 释.`, `其 '文字' ${word}.`, `其 # 注释\n${word}.`])
            assert.equal(hoverAt(source, source.lastIndexOf(word)), undefined, source);
        for (const [open, close] of [["'", "'"], ['"', '"'], ['‘', '’'], ['“', '”']]) {
            const source = `${open}其 ${word}${close}`;
            assert.equal(hoverAt(source, source.indexOf(word)), undefined, source);
        }
    }
});

test('cache help states immutable signatures, lifecycle and limits', () => {
    const expected = {
        缓存:['缓存 宽 高 绘制','宽:','高:','绘制:','三参均必需','不混用','返回不可变图像','只读','1～2048','初始化','一个临时绘图目标','都失效','每帧／输入回调','8张','4,194,304','128 KiB','2047','2048','逐帧传输','不承诺60fps'],
        贴图:['贴图 图像 横 纵','图像:','横:','纵:','三参均必需','不混用','返回空','1:1','变换／裁剪','source-over','不重新着色','100000','停／继续','旧图像宽高仍可读'],
        宽:['只读','不可赋值','无参不写括号','失效后宽高仍可读'],
        高:['只读','不可赋值','无参不写括号','失效后宽高仍可读']
    };
    for (const [word, phrases] of Object.entries(expected)) {
        const text = hoverAt(`图 其 ${word}.`, 4).text;
        for (const phrase of phrases) assert.ok(text.includes(phrase), `${word}: ${phrase}`);
    }
    for (const word of ['绘制','图像','横','纵']) assert.equal(hoverAt(`${word} 取 1.`, 0), undefined);
    const snippet = require('../snippets/ru.json')['如观不可变缓存'];
    assert.deepEqual(snippet.prefix, ['ruguan-cache','如观缓存']);
    for (const term of ['0.19.8','0.8.8','Python / browser-js','CLI 不支持画布']) assert.ok(snippet.description.includes(term));
    const source = snippet.body.join('\n');
    for (const term of ['缓存 宽:80 高:60 绘制:(作 层:', '底图 其 宽', '底图 其 高', '贴图 图像:底图 横:20 纵:20', '贴图 底图 0 0', '图 其 恢复.']) assert.ok(source.includes(term));
});


test('native module help uses exact import literals and preserves ordinary names and strings', () => {
    for (const name of ['如:密', '如见']) {
        for (const [open, close] of [["'", "'"], ['"', '"'], ['‘', '’'], ['“', '”']]) {
            const source = `模块 取 外言 ${open}${name}${close}.`;
            const result = hoverAt(source, source.indexOf(name));
            for (const term of ['0.20.0', 'Windows x64', 'Python', '--allow-native', '如书', '崩溃', '沙箱'])
                assert.ok(result?.text.includes(term), `${name}: ${term}`);
            assert.equal(source.slice(result.start, result.end), name);
        }
        for (const source of [`'${name}'`, `# 外言 '${name}'`, `批. 外言 '${name}'`, `解. 外言 '${name}' 释.`,
            `外言者 '${name}'`, `外言 2 '${name}'`, `外言 '${name}其他'`, `外言 '${name}`, `外言 # 注释\n'${name}'`])
            assert.equal(hoverAt(source, source.indexOf(name)), undefined, source);
    }
    for (const word of ['如见', '密', 'u64', 'UTF16', '解UTF16', '窗口', 'Win32'])
        assert.equal(hoverAt(`${word} 取 1.`, 0), undefined, word);
    for (const term of ['如:密', '如见', 'Windows x64', '普通名称', '文件名前'])
        assert.ok(hoverAt('外言', 0).text.includes(term), term);
    const snippets = require('../snippets/ru.json');
    assert.ok(snippets['原生机器值'].body.join('\n').includes("'18446744073709551615'"));
    assert.ok(snippets['原生机器值'].body.includes('文 其 关闭.'));
    assert.ok(snippets['如见绑定概览'].body.includes('显 (见 其 Win32 其 WNDCLASSEXW) 其 大小.'));
    assert.ok(snippets['如见绑定概览'].description.includes('不创建窗口'));
});

test('canonical import-all and retired spelling have explicit whole-token migration help', () => {
    const canonical=hoverAt("尽取 外言 '如:数学'.",0).text;
    for(const term of ['尽取须连写','模块顶层','静态解析','名称冲突','旧 尽 取 已停用']) assert.ok(canonical.includes(term),term);
    assert.ok(hoverAt("尽 取 外言 '如:数学'.",0).text.includes('请改用 尽取 外言'));
    for(const source of ['尽取值','尽取器','未尽取','𠀀尽取','尽取²','α尽取','_尽取',"'尽取'",'批. 尽取','解. 尽取 释.','进取','言']) {
        const offset=source.indexOf('尽取');
        assert.equal(hoverAt(source,offset<0?0:offset),undefined,source);
    }
    const snippets=require('../snippets/ru.json');
    assert.ok(snippets['全量导入'].body[0].startsWith('尽取 外言 '));
    assert.ok(snippets['竞赛模板'].body[0].startsWith('尽取 外言 '));
});

test('scope help shows the complete statement period', () => {
    assert.ok(hoverAt('段:', 0).text.includes('{ … }.'));
});
