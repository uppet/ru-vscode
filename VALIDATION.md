## 0.8.2 local verification · 2026-10-14

- Independent checkout of 0.8.1 commit `6584449eed78246b2cb5554c76af1b6d24875e0b`, tree `fa04be7d4a774797e2153db90c1b4d5492fdfd4b`. Original checkout preserved. No remote publication, CI rerun or Library replacement by this task.
- Final contract and actual interpreter: Ru 0.19.6 / 如书 0.8.6, frozen commit `0af1e0ed344f84a6cfa4e84d363a26e528084717`, tree `6c576480de94677a8163d293da5505144182db62`; clean tracked files verified before and after tests. Cross-checked `docs/ruguan-guide.md`, `rulang/language-spec.md`, Python graphics runtime and browser runtime.
- `npm run lint`: strict TypeScript plus manifest/grammar/snippet validation passed.
- `npm test`: all 60 unit tests passed. New regression cases cover contextual 弧 / 扇形 / 折线 / 贝塞尔, exact signatures and named parameters, minimum versions, ordinary names and parameter names, Unicode boundaries, four quote pairs and comments. Existing launch/trust/diagnostic regressions remain passing.
- `RU_LANGUAGE_ROOT=/workspace/shared/ru-graphics-bezier npm run test:ru`: all 43 default-expanded snippets checked against the final actual Ru toolchain. Eight notebook snippets executed twice with real Python GraphicsHost; all nine graphics-related snippets, including pure color construction, compiled with the actual browser compiler and executed twice under Node's browser-runtime harness. Node here runs browser-js output; it does not provide a normal Node-target graphics host.
- New Python and browser assertions verify exact sector / signed-arc geometry and styles, polyline points remaining unchanged after source-point mutation, retained fill state, positional and named eight-coordinate Bezier commands, and unchanged control-line / curve styles. Existing transparency, text alignment, animation timing, pause/resume, transforms, clipping and repeat-execution assertions also passed.
- Pure-color snippet still executes in ordinary Python CLI `run` and returns exact eight-digit colors; its `check` rejection remains expected. All eight actual canvas snippets fail ordinary CLI `run` and `check` with the expected notebook-host message. No false blanket claim that pure color construction requires a canvas host.
- Minimum-version tests separately ran the new arc/sector snippet under Ru 0.19.4 commit `ec75663795db37700427ea1aea676f728d7e577e` and the polyline snippet under Ru 0.19.5 commit `0c8270b40fe9ecd4377f6c956c82cecce94152e9`, each twice in Python GraphicsHost and compiled browser runtime.
- Compared against the baseline: all 40 existing snippets, commands, settings, activation events, capabilities, engines and dependencies unchanged. Added three snippets; no new runtime dependencies or editor commands.
- `npm run package`: VSIX 0.8.2 created and inspected separately for ZIP integrity, version, manifest, grammar, snippets, compiled extension and bundled documentation. Archive source entries match the final working tree. Archive size: 40,434 bytes; SHA-256 `8824575f2bd69b52f3a72e60a3f1e31f91c5d3f21d35a4c2ce0eca43efe91b4b`; 12 ZIP entries. The entry manifest is recorded with the build artifact.
- Extension-host regression source adds path hover registration/suppression and the three new snippet insertions; Node syntax checks passed. Actual Electron extension-host testing was not run locally: DISPLAY is absent and Xvfb is not installed. No browser UI / canvas pixel, new Windows/macOS GUI or remote-host validation is claimed; check CI separately for the exact published commit.

## 0.8.1 local verification · 2026-10-14

- Independent copy of the 0.8.0 source tree `689dc6618deb53b8d865b8268e793c90ebddf3c5` (commit `1083fc87aa365125aa7503d9f153d1d946957ad8`); original checkout preserved. No remote publication, CI rerun or Library replacement by this task.
- Contract and final real-interpreter source: Ru 0.19.3 / 如书 0.8.3, commit `2abe9e1fc9c8d4176b5e8fc1788e12f917db5263`, tree `62baa3cc0186cf7985a0c652ad1df614ce352396`; verified `docs/ruguan-guide.md` and `rulang/language-spec.md`.
- `npm run lint`: strict TypeScript plus manifest/grammar/snippet validation passed.
- `npm test`: all 57 unit tests passed, including contextual 颜色 / 文字对齐 / 经过秒 / 间隔秒, minimum-version and exact-argument help, ordinary names, Unicode boundaries, strings and comments. Existing launch/trust/diagnostic regressions passed unchanged.
- `RU_LANGUAGE_ROOT=/workspace/shared/ru-graphics-time npm run test:ru`: all 40 default-expanded snippets checked against actual Ru. Five notebook snippets executed twice with the real Python GraphicsHost. The pure-color snippet ran through the ordinary Python CLI and returned exact eight-digit values; its `check` rejection preserves the existing compiled-target module boundary.
- New real-host assertions cover transparent background and alpha color snapshots; centered / right-baseline text and saved/restored alignment across callbacks; frozen clock reads, first-frame zero delta, real frame movement, input zero delta, stop/resume first-frame zero delta, repeated continue, uncapped hidden/delayed gap and repeat execution.
- Minimum-version checks additionally executed pure-color construction on Ru 0.19.1 (`3645e930e50b5f2cd66a10f904a123a843e60d00`) and transparent aligned text on Ru 0.19.2 (`d7e8400c8ed85bad805b0c79faa5e62491a641d0`).
- An additional local smoke run compiled all six graphics-related snippets with the actual browser compiler and executed the generated browser runtime under Node, twice each. Color values, text alignment snapshots, time-driven movement and pause/resume behavior passed. This is browser-runtime coverage, not browser UI or canvas pixel validation.
- `npm run package`: VSIX created; ZIP integrity, version 0.8.1, manifest, grammar, snippets, compiled extension and bundled documentation verified against the final working tree. No runtime dependencies added.
- Extension-host regression source covers the new hovers and snippet insertion, and has a syntax check. Actual Electron extension-host testing was not run locally: this cloud executor has no Xvfb or display. No new Windows/macOS GUI, remote-host, VS Code UI or rendered browser validation is claimed; check CI separately for the exact published commit.

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
