/** Lexical help only: this scanner never resolves a binding or executes source. */
const start = /[\p{L}_]/u;
const part = /[\p{L}\p{N}_]/u;
const help: Record<string, string> = {
    '取': '取：名称赋值的一般规则\n\n在函数或过程中，先写当前局部已有绑定；否则写词法捕获链中已有的非模块绑定；再否则建立当前局部。不会借此隐式改写模块绑定。救块中的直接取写救块局部，内部闭包可捕获它。其成员或下标赋值另按目标对象处理。\n\n这是语言规则提示，不是对此处绑定归属的语义分析。',
    '算': '算：函数与闭包\n\n闭包按词法环境捕获绑定。取优先写当前局部，其次写已有的非模块捕获绑定，否则建立局部；不会隐式改写模块绑定。这里仅解释规则，不判断具体捕获。',
    '作': '作：过程与闭包\n\n闭包按词法环境捕获绑定。取优先写当前局部，其次写已有的非模块捕获绑定，否则建立局部；不会隐式改写模块绑定。这里仅解释规则，不判断具体捕获。',
    '形': '形：声明类型名\n\n形名用于类型标注、如判断与新构造，不是可赋值、传参或返回的普通值。'
};
export function hoverAt(source: string, offset: number): { start: number; end: number; text: string } | undefined {
    let i = 0;
    const char = () => String.fromCodePoint(source.codePointAt(i)!);
    const boundary = () => !/[\p{L}\p{N}_]$/u.test(source.slice(Math.max(0, i - 2), i));
    const marker = (word: string) => source[i] === word && /[.。]/.test(source[i + 1] ?? '');
    while (i < source.length) {
        if (source[i] === '#' || source.startsWith('//', i) || (boundary() && marker('批'))) {
            const end = source.indexOf('\n', i); i = end < 0 ? source.length : end + 1; continue;
        }
        if (boundary() && marker('解')) {
            i += 2;
            while (i < source.length) {
                if (marker('释')) { i += 2; break; }
                i += char().length;
            }
            continue;
        }
        const closer: Record<string, string> = { "'": "'", '"': '"', '‘': '’', '“': '”' };
        if (closer[source[i]]) {
            const end = closer[source[i++]];
            while (i < source.length) {
                if (source[i] === '\\') { i += 2; continue; }
                if (source[i++] === end) { break; }
            }
            continue;
        }
        if (start.test(char())) {
            const eligible = boundary();
            const begin = i; i += char().length;
            while (i < source.length && part.test(char())) { i += char().length; }
            const text = help[source.slice(begin, i)];
            if (eligible && text && offset >= begin && offset < i) { return { start: begin, end: i, text }; }
            continue;
        }
        i += char().length;
    }
    return undefined;
}
