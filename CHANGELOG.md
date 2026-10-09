# Changelog

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
