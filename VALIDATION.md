# Validation — 0.3.0

Prepared 2026-10-09 for the Ru 0.10.0 release.

Local checks:

- `npm run check`: strict TypeScript, manifest/configuration validation, 33 unit and real TextMate/Oniguruma tests, VSIX packaging.
- Facts, nested map grammar, type annotations, Unicode keyword boundaries (including 完成), paired Enter rules and map snippet templates.
- Facts/map lexical hover and suppression in strings, comments and longer identifiers.
- Existing nested anonymous functions, mixed/omitted parameter types, 完 statement, Chinese comments and four quote-pair regressions retained.
- Separate `RU_LANGUAGE_ROOT=... npm run test:ru` checks all 22 default-expanded snippets and runtime truthiness, map methods/callbacks, interactive stdin/argv and explicit/natural procedure completion.
- Existing trust, save/Save As, duplicate-run, failure/retry and launch argument regressions retained.
- VSIX ZIP integrity; no runtime npm dependencies.

Real VS Code 1.90.2 extension-host coverage runs in GitHub Actions for each exact commit: activation, association, fact/map/完 hover registration and suppression, paired map Enter indentation and snippet insertion, Chinese line/block comment toggle round-trips, terminal stdin, argv/cwd, exit status, duplicate protection and rerun. Check the exact commit's completed Actions result; local tests alone do not imply CI passed. This cloud executor has no Xvfb executable, so local Electron UI coverage is unavailable.

Native Windows/macOS UI and remote-host UI were not executed; platform command construction has unit coverage.
