## 0.8.8

- 配套 Ru 0.24.0 的 `续.`：完整关键字高亮、循环边界悬停、补全片段及包模块名保留字边界。
- `续` 不新增缩进／折叠边界，`继续` 等长名称不拆分；循环外或跨调用使用由对应工具链拒绝。
- 保留 `完.` 提前结束当前作的行为；安装扩展不会自动升级 CLI。

## 0.8.7

- 同步 Ru 0.23.0 的 `另若` 条件链：高亮、缩进、片段、悬停和包模块名保留字边界。
- 保留旧 `另 若` 嵌套语义；新语法需对应工具链，不改变运行授权或自动更新解释器。

## 0.8.6

- 配套 Ru 0.22.0 开发版的上下文 `吾 言` 声明与具名静态导入链；纯词法 semantic tokens 支持跨行注释，不全局保留吾／言，也不将模块段误提示为内置成员。
- 添加声明、具名取／尽取和静态集录片段；仅集录文件提供清单字段说明，不提供 schema 校验、联网获取或导航。
- 普通／原生运行拒绝集录，覆盖另存为后的路径；保留原生逐次确认与0.21.7句点 warning / error Problems行为。
- 新增词法、TextMate、运行保护、extension-host回归源及实际Ru本地包片段夹具。实际执行范围见VALIDATION.md。

## 0.8.5

- 同步完整语句句点规范：片段、悬停说明与示例使用句点，保留匿名表达式的边界。
- Problems 匹配器识别编译器 warning / error 严重级别；旧版无级别诊断仍默认为错误。保留 Windows、中文路径与行定位。

## 未发布：全量导入语法迁移

- 同步 Ru 0.20.0 开发版的完整关键词 `尽取`，保留 `外言`；旧 `尽 取` 停用的悬停迁移提示、Unicode 名称边界和竞赛／全量导入片段同步。
- 单字 `尽` 继续保留用于迁移诊断，不新增 `进取` 或 `言` 别名；旧版本记录保留当时事实。

## 0.8.4

- Add a separate one-shot native-run command for Ru 0.20.0 如:密 and bundled third-party 如见, without a shortcut or persistent permission setting. Ordinary Run stays unchanged.
- Ask modal consent before saving or launching, name the exact file and account-level native risk, reject untitled/virtual targets, and revalidate document identity, version, active editor and trust after consent/save/async preparation.
- Share pending/live-task guards across both commands; put `--allow-native` before the filename and preserve Python/program argument separation.
- Add exact-import module hover and two non-GUI snippets, keeping exports ordinary names. Isolate native snippet verification from regular C-target smoke; Windows native execution requires an explicit test opt-in.
- Preserve the existing problem matcher and post-task-exit integration diagnostic assertions.

## 0.8.3

- Add contextual ordinary-member highlighting and hover help for immutable cache creation, image placement and read-only dimensions (Ru 0.19.8 / 如书 0.8.8).
- Add `ruguan-cache` / `如观缓存`, with initialization-only recording, named and positional image placement, read-only dimensions and restored transforms.
- Document lifecycle, quotas and unchanged CLI boundary; keep commands, diagnostics and the integration task-marker timing correction unchanged.

## Unreleased

- 修复 VS Code integration 测试等待 Problems 后才发送 stdin 的循环等待：保留交互输入与完整行定位断言，在普通任务退出后等待诊断发布。
- 增加失败重跑刷新诊断、成功重跑清除旧诊断的真实宿主回归，并说明终端即时输出与 Problems 发布时序。运行器、matcher 和产品版本保持 0.8.2。

## 0.8.2

- 累计同步如观弧／扇形（Ru 0.19.4）、开放折线（0.19.5）与三次贝塞尔（0.19.6）：仅在 `其` 后高亮与悬停说明，不新增保留字。
- 明确六参带符号弧度、部分／整圈扇形、点阵深复制、八参控制点与只描边语义，以及精确命名参数和宿主边界。
- 新增三个可直接放入如书 Python／browser-js 运行的短片段：弧与扇形、折线快照、贝塞尔控制点。保留纯颜色在 Python CLI `run` 的例外。
- 保留现有运行命令、信任限制、配置与语言能力，不增加运行时依赖；加入词法边界、真实解释器和 browser-js 运行时回归。

## 0.8.1 · 2026-10-14

- Sync three small Ru graphics updates: alpha colors / 颜色 (Ru 0.19.1+), 文字对齐 (0.19.2+), and 经过秒 / 间隔秒 (0.19.3+), with contextual member highlighting and lexical hover only.
- Correct six-digit-only color help; document exact channel/alignment arguments, eight-digit opacity, captured text styles, monotonic callback snapshots, pause/resume and real frame gaps. No new reserved words.
- Add three practical snippets: CLI-only color construction, transparent aligned notebook text, and elapsed/delta-time animation. Keep the one-parameter 每帧 callback and existing CLI/compiled-target capability boundaries.
- Extend real-Ru snippet assertions for color values, text snapshots and restored styles, deterministic frame timing, pause/resume and repeated execution; keep launch commands, dependencies and interpreter installation unchanged.

## 0.8.0 · 2026-10-13

- Sync Ru 0.19.0 / 如书 0.8.0: contextual highlighting and lexical hover for 三角形、多边形、平移、旋转、缩放、保存、恢复、变换、重置变换、裁剪、取消裁剪.
- Document native nonzero paths, right-multiplied Canvas transforms, clipping snapshots and intersections, state-stack pairing, limits, and callback reset behavior.
- Add one compact notebook graphics snippet with explicit save/restore; execute it using the actual GraphicsHost and verify transform/clip snapshots and repeated-cell execution.
- Preserve ordinary identifiers, string/comment protection, existing snippets and CLI launch behavior; no new reserved words, commands or dependencies.

## 0.7.0 · 2026-10-13

- Sync Ru 0.18.0: contextual member highlighting and hover for array 排序, 另成, 逐位 and dictionary 逐目.
- Teach stable shallow sorting, exact fact-valued 先于 predicates, one-argument 算 transformation, and snapshot traversal without filtering or deep copying.
- Add runnable sort/object transformation and traversal snippets; migrate dictionary 列 snippets to 逐目 while leaving directory 列 and the legacy 如:竞 three-way comparator unchanged.
- Cover contextual hover, grammar and real-Ru snippet execution; preserve CLI launch and diagnostic behavior.

## 0.6.0 · 2026-10-13

- Sync Ru 0.17.0: use canonical standard-module imports `如:观` and `如:竞`; product names remain 如观 and 如竞.
- Update snippets, import hover, and regression coverage; old imports `如观`, `如竞`, and `如:竞赛` require source migration rather than aliases.
- Keep CLI launch and diagnostic behavior unchanged.

## 0.5.1 · 2026-10-12

- 为 Run Current File 任务接入 `$ru` problem matcher，识别标准 `file:line[:column]: error:` 及旧中文诊断格式。
- Problems 面板按原始如源码行定位；保留终端中的原始列信息，避免将 Unicode 码点列误当 UTF-16 列。
- 排除 REPL、如书格子等虚拟来源，避免错误跳转到磁盘文件。

# Changelog

## 0.5.0 — 2026-10-11

- Sync Ru 0.13: rename contest imports to 如竞 without the old 如:竞赛 alias.
- Add 如观 drawing and interactive animation snippets, with import hover and explicit 如书 Python-only execution guidance.
- Update internal contest bridge highlighting and regression coverage; CLI launch behavior stays unchanged.

## 0.4.2 — 2026-10-10

- Sync Ru 0.12.1 dictionary named parameters: 查/除 目, 增 目/相, without legacy 键/值 aliases.
- Update dictionary terminology, hover and snippets; preserve array 值 parameters and user-defined callback names.
- Add named-argument runtime, snippet and hover regressions.

## 0.4.1 — 2026-10-09

- Sync Ru 0.12 practical text, math, random and array libraries.
- Add contextual 删/弹/查 member highlighting and lexical hover without reserving ordinary names.
- Add executable module and array snippets; clarify bare 弹 and receiver-dependent 查.
- Correct README compatibility version and extend real Ru / VS Code host regressions.

## 0.4.0 — 2026-10-09

- Add scoped 段: … 落. highlighting, paired indentation, snippets and lexical help.
- Support statement-position braces alongside expression-position dictionaries.
- Explain block-local direct assignment and preserve member 段, longer names, strings and comments.
- Add := / ：= assignment alias highlighting, snippets and hover without changing colon syntax.
- Extend TextMate, hover, real interpreter and VS Code host regressions.

## 0.3.1 — 2026-10-09

- Add brace-delimited dictionary highlighting, pairing, paired Enter indentation and two snippets.
- Preserve 典/成, nested anonymous functions, strings, comments and existing statement blocks.
- Extend real TextMate, VS Code host and actual Ru snippet/runtime regression coverage.

## 0.3.0 — 2026-10-09

- Sync with Ru 0.10.0: independent 事实 type and 真/假 literals, with migration guidance for truthiness and comparisons.
- Highlight nested 典: … 成 literals with Unicode identifier boundaries, preserving 完成, anonymous functions, comments and type annotations.
- Add paired map snippets, empty maps, map callbacks, fact parameters, conservative indentation and paired Enter handling.
- Add lexical fact/map hover documenting ordinary methods, unordered snapshot enumeration and shape-key 同/印 contracts.
- Preserve all interactive runner, trust/save and optional-parameter behavior; no interpreter bundled or Marketplace publishing.

## 0.2.2

- 对应 Ru 0.9.0（RU008）：省略及混合参数类型片段、规则悬停与文档。
- 修正省略类型的声明名高亮，避免把表达式中的匿名参数误标为函数名。
- 保留显式类型片段、中文注释、完及运行行为；不发布 Marketplace。

## 0.2.1

- Add Ru 0.8.0 procedure exit statement 完. / 完。 highlighting, snippet and lexical hover help.
- Document that explicit and natural procedure completion both return 空; 算 / 得 is unchanged.
- Keep 完 out of block delimiters and indentation; preserve Unicode identifiers, comments, strings and runner protections.

## 0.2.0

- Align with Ru 0.7.0: Chinese line/block comments, comment toggles and two new snippets.
- Add lexical hover help for assignment, closures and shape type names; never claim binding resolution.
- Explain removal of first-class shape values; preserve interactive runner and trust behavior.
- Test comment boundaries, non-nesting, strings, hover suppression and real-host comment toggling.

## 0.1.0

- Initial independent extension for Ru 0.6.0.
- Unicode-aware highlighting, full-width brackets, conservative indentation and ten snippets.
- Interactive Run Current File with save confirmation, configurable Python/CLI/cwd/arguments, trust checks and duplicate-run protection.
- TextMate, launch planner, command lifecycle and real extension-host tests; CI packages VSIX without marketplace publishing.
