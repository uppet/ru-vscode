/** Package syntax is lexical help only. No filesystem reads, resolution or downloads. */
const reserved = new Set('显 取 为 得 完 破 若 则 另若 另 然 循 次 环 算 作 法 其 且 或 非 空 真 假 典 成 对 形 象 如 新 外言 尽取 尽 试 救 卒'.split(' '));
interface Token { value: string; start: number; end: number; kind: 'name' | 'string' | 'other' }
export interface PackageToken { start: number; end: number; type: 'keyword' | 'namespace'; declaration: boolean }
const declarationHelp = '吾 言：模块声明（Ru 0.22.0 开发版）\n\n吾 言 工程 其 力学. 仅模块顶层一次，必须完整并以句点结束；不执行、不建立变量或新缩进块。有包时须匹配作者正式名，消费者依赖别名不改变声明。吾、言不是全局关键词；旧调用若恰好写成完整声明，可用 吾 (言) 工程. 保留调用。这里只识别完整词法形状，不验证名字或重复声明。';
const syncHelp = '\n\n默认 deps sync 无锁时首次解析，有有效锁时精确恢复且保持锁字节不变；--locked 要求已有有效锁，--update 才重新选择，两者互斥。错误后不能擅自改用 --update。缓存使用当前 RU_PACKAGE_CACHE 或 ~/.cache/ru/packages；相对依赖可随同布局搬迁，显式绝对路径不可搬迁。';
const importHelp = '具名外言：静态模块名（Ru 0.22.0 开发版）\n\n外言 物理 其 力学 的整条其链属于静态名字，不是成员求值。先赋值再访问成员，或写 (外言 物理 其 力学) 其 动量 2 3.。首段选择当前包或依赖别名；作者声明仍使用包的正式名。跨包只开放集录公开入口。\n\nrun / check / build 离线解析，不自动下载。缺少远程缓存时显式执行 ru deps sync 项目目录；编辑器不联网、不安装、不发布，也不提供模块导航。browser-js 仍只允许固定标准库。';
const manifestHelp = '集录.ru：静态包清单（Ru 0.22.0 开发版）\n\n仅一个静态典，不运行代码或计算字段。顶层字段仅名、版、需如言、源码根、公开、依赖；名必填，版默认0.0.0，源码根默认src。公开列表相对源码根；公开映射的路径相对包根。依赖来源为路径、Git或目录三选一，禁止混用。消费者别名不改变作者正式名。\n\n这里只提供说明，不是 schema 验证或实时诊断；重复、未知字段、类型、边界错误由工具链报告。run / check / build 不自动联网，远程获取需显式 ru deps sync 项目目录。不要运行清单。';
const fieldHelp: Record<string, string> = {
    '名': '包的正式根名称，唯一必填顶层字段。',
    '版': '三段版本，默认0.0.0。',
    '需如言': '如言版本约束；exact或比较区间交集，不支持^、~、通配符。',
    '源码根': '相对包根，默认src；不是公开映射路径的基准。',
    '公开': '列表使用相对源码根的模块名；映射的文件路径相对包根。',
    '依赖': '别名到单一来源描述的典；路径、Git、目录三选一。',
    '路径': '相对路径以声明该依赖的集录为基准；也支持当前宿主显式绝对目录，按原样使用且不可搬迁，拒绝异平台盘符。',
    'Git': 'HTTPS或SSH仓库；引用默认HEAD，子目录默认仓库根。',
    '引用': 'Git分支、标签或完整commit。',
    '子目录': 'Git仓库中的相对包目录。',
    '目录': '显式目录协议URL；没有默认线上目录。',
    '包': '目录来源中的包名，别名可不同。'
};
export function isPackageManifest(fileName: string): boolean { return fileName.replace(/\\/g, '/').split('/').pop() === '集录.ru'; }
function tokens(source: string): Token[] {
    const result: Token[] = [];
    let i = 0;
    while (i < source.length) {
        const rest = source.slice(i);
        const boundary = !/[\p{L}\p{N}_]$/u.test(source.slice(Math.max(0, i - 2), i));
        if (/^\s/u.test(rest)) { i++; continue; }
        if (rest.startsWith('#') || rest.startsWith('//') || (boundary && /^批[.。]/u.test(rest))) {
            const end = source.indexOf('\n', i); i = end < 0 ? source.length : end + 1; continue;
        }
        if (boundary && /^解[.。]/u.test(rest)) {
            const end = /释[.。]/u.exec(source.slice(i + 2)); i = end ? i + 2 + end.index + 2 : source.length; continue;
        }
        const start = i;
        const closer: Record<string, string> = { "'": "'", '"': '"', '‘': '’', '“': '”' };
        if (closer[source[i]]) {
            const close = closer[source[i++]];
            while (i < source.length) { if (source[i] === '\\') { i += 2; } else if (source[i++] === close) { break; } }
            result.push({ start, end: i, value: source.slice(start + 1, i - 1), kind: 'string' }); continue;
        }
        const number = /^(?:[0-9]+(?:\.[0-9]+)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?/u.exec(rest);
        const name = /^[\p{L}_][\p{L}\p{N}_]*/u.exec(rest);
        const value = number?.[0] || name?.[0] || String.fromCodePoint(source.codePointAt(i)!);
        i += value.length;
        result.push({ start, end: i, value, kind: name && !number && boundary ? 'name' : 'other' });
    }
    return result;
}
export function packageTokens(source: string): PackageToken[] {
    const ts = tokens(source), result: PackageToken[] = [], blocks: string[] = [];
    // Precompute header boundaries so a long unfinished buffer stays linear.
    const nextHeaderBoundary: number[] = new Array(ts.length + 1).fill(ts.length);
    for (let i = ts.length - 1; i >= 0; i--) {
        nextHeaderBoundary[i] = ts[i].kind !== 'string' && [':', '：', '.', '。', '法', '象'].includes(ts[i].value) ? i : nextHeaderBoundary[i + 1];
    }
    const name = (i: number) => ts[i]?.kind === 'name' && !reserved.has(ts[i].value);
    const chain = (i: number) => { if (!name(i)) { return i; } i++; while (ts[i]?.value === '其' && name(i + 1)) { i += 2; } return i; };
    const add = (from: number, to: number, declaration: boolean) => {
        for (let k = from; k < to; k++) {
            const t = ts[k]; result.push({ start: t.start, end: t.end, type: k === from || (declaration && k === from + 1) || t.value === '其' ? 'keyword' : 'namespace', declaration });
        }
    };
    let statementStart = true;
    for (let i = 0; i < ts.length; i++) {
        const t = ts[i], v = t.value;
        if (t.kind === 'string') { statementStart = false; continue; }
        if (t.kind === 'name' && v === '外言' && name(i + 1)) { const end = chain(i + 1); add(i, end, false); i = end - 1; statementStart = false; continue; }
        if (blocks.length === 0 && statementStart && t.kind === 'name' && v === '吾' && ts[i + 1]?.kind === 'name' && ts[i + 1]?.value === '言') {
            const end = chain(i + 2);
            if (end > i + 2 && ['.', '。'].includes(ts[end]?.value)) { add(i, end, true); i = end - 1; statementStart = false; continue; }
        }
        // Conservative nesting guards only; malformed source is left to the compiler.
        if (t.kind === 'name' && ['算', '作', '形'].includes(v)) {
            const j = nextHeaderBoundary[i + 1];
            if ([':', '：'].includes(ts[j]?.value)) { blocks.push(v === '算' ? '法' : v === '作' ? '为' : '象'); }
        } else if (t.kind === 'name' && ['若', '循', '试'].includes(v)) { blocks.push(v === '若' ? '然' : v === '循' ? '环' : '终'); }
        else if ((v === '段' || v === '典') && [':', '：'].includes(ts[i + 1]?.value)) { blocks.push(v === '段' ? '落' : '成'); }
        else if (['{', '｛', '(', '（', '[', '［'].includes(v)) { blocks.push(({ '{': '}', '｛': '｝', '(': ')', '（': '）', '[': ']', '［': '］' } as Record<string, string>)[v]); }
        else if (blocks.at(-1) === v && (v !== '为' || ['.', '。'].includes(ts[i + 1]?.value))
            && (v !== '终' || statementStart || ts[i - 2]?.value === '救'
                || ([':', '：'].includes(ts[i - 1]?.value) && ts[i - 3]?.value === '救'))) { blocks.pop(); }
        statementStart = ['.', '。'].includes(v);
    }
    return result;
}
export function packageHoverAt(source: string, offset: number, fileName = ''): { start: number; end: number; text: string } | undefined {
    if (isPackageManifest(fileName)) {
        const ts = tokens(source);
        const i = ts.findIndex(t => offset >= t.start && offset < t.end);
        const t = ts[i];
        if (t && ((t.kind === 'name' && t.value === '典') || (t.kind === 'string' && ['对', ':', '：'].includes(ts[i + 1]?.value) && fieldHelp[t.value]))) {
            return { start: t.start, end: t.end, text: manifestHelp + syncHelp + (t.kind === 'string' ? '\n\n' + t.value + '：' + fieldHelp[t.value] : '') };
        }
        return undefined;
    }
    const token = packageTokens(source).find(t => offset >= t.start && offset < t.end);
    return token ? { start: token.start, end: token.end, text: token.declaration ? declarationHelp : importHelp + syncHelp } : undefined;
}
