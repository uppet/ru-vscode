## 0.8.0 local verification · 2026-10-13

- Independent copy of 0.7.0 source tree `ba26991439ff67e623c1f70d90949d8ae2a64d0d`; original checkout preserved. No remote publication or CI rerun by this task.
- Contract and real-interpreter source: Ru `2663b0712a06647e21f4c4d4440b10c50ffcfdb2` (Ru 0.19.0 / 如书 0.8.0), `docs/ruguan-guide.md` and `rulang/language-spec.md`.
- `npm run lint`: TypeScript and manifest/grammar/snippet validation passed.
- `npm test`: 54 unit tests passed, including all 11 new contextual members, ordinary bindings, Unicode boundaries, strings and comments.
- `RU_LANGUAGE_ROOT=/workspace/shared/ru-graphics-upgrade npm run test:ru`: all 37 default-expanded snippets passed against actual Ru. Three graphics snippets ran with the real Python GraphicsHost; the new transform snippet verifies exact polygon points, accumulated matrix, fixed clipping snapshot, restored state and repeat execution. Ordinary CLI/check rejection remains verified.
- `npm run package`: VSIX created with compiled extension, grammar, snippets and documentation; ZIP integrity and package version checked separately.
- Extension-host regression source also covers new hover registration/suppression and snippet insertion. It was not executed locally: this cloud executor has no Xvfb/display. No new browser-js visual, Windows/macOS GUI or remote-host validation is claimed. Check remote CI separately for its exact published commit.

## 0.7.0 local verification · 2026-10-13

- Independent copy of the existing 0.6.0 working tree; original checkout preserved. No remote publication.
- `npm run lint`: TypeScript and manifest/grammar/snippet validation passed.
- `npm test`: 52 unit tests passed, including contextual member hover and grammar.
- `RU_LANGUAGE_ROOT=/workspace/shared/ru-array-interfaces npm run test:ru`: passed against the integrated Ru toolchain, including every snippet and exact output assertions for new sorting/transformation/traversal examples.
- These are local command-line checks; no new VS Code extension-host or visual session is claimed. Packaging is a separate final step.

# Validation — 0.4.0

Prepared 2026-10-09 for the Ru 0.10.0 release.

Local checks:

- `npm run check`: strict TypeScript, manifest/configuration validation, 40 unit and real TextMate/Oniguruma tests, VSIX packaging.
- Facts, nested map grammar, type annotations, Unicode keyword boundaries (including 完成), paired Enter rules and map snippet templates.
- Facts/map lexical hover and suppression in strings, comments and longer identifiers.
- Existing nested anonymous functions, mixed/omitted parameter types, 完 statement, Chinese comments and four quote-pair regressions retained.
- Separate `RU_LANGUAGE_ROOT=... npm run test:ru` checks all 27 default-expanded snippets and runtime truthiness, map methods/callbacks, interactive stdin/argv and explicit/natural procedure completion.
- Existing trust, save/Save As, duplicate-run, failure/retry and launch argument regressions retained.
- VSIX ZIP integrity; no runtime npm dependencies.

Real VS Code 1.90.2 extension-host coverage runs in GitHub Actions for each exact commit: activation, association, fact/map/完 hover registration and suppression, paired map Enter indentation and snippet insertion, Chinese line/block comment toggle round-trips, terminal stdin, argv/cwd, exit status, duplicate protection and rerun. Check the exact commit's completed Actions result; local tests alone do not imply CI passed. This cloud executor has no Xvfb executable, so local Electron UI coverage is unavailable.

Native Windows/macOS UI and remote-host UI were not executed; platform command construction has unit coverage.

Symbol dictionaries: ASCII/full-width brace pairing, nested TextMate states mixed with 典/成, string/comment protection, conservative indentation, two new default-expanded snippets, and actual interpreter lookup/empty-map execution pass locally. Real VS Code CI additionally checks brace auto-closing, paired Enter and snippet insertion.

Scoped blocks and assignment aliases: nested 段/落 states, ordinary 段/落 bindings and members, strings/comments, ASCII/full-width braces, paired Enter, three new snippets, and := / ：= versus plain colons have regression coverage. Hover describes direct block-local writes versus closure writes and never claims to resolve bindings. Actual interpreter checks exercise block shadowing, nested scope restoration and both assignment aliases. Real VS Code host tests additionally insert the three snippets and verify scope/alias hover and 段:落. paired Enter. Grammar uses conservative lexical scope recognition as documented in README.
