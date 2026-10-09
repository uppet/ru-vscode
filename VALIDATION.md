# Validation — 0.2.2

Verified 2026-10-09 against the Ru 0.9.0 working tree.

Passed locally:

- `npm run check`: strict TypeScript, manifest/configuration checks, 29 unit and real TextMate/Oniguruma tests, VSIX packaging.
- RU008 omitted/mixed parameter highlighting, anonymous expression parameters, lexical hover, required-arity wording and explicit/natural 空 results through the real interpreter.
- Chinese comments: both punctuation forms, Unicode opener boundaries, multiline state, non-nesting, first exact closer, strings and legacy comments.
- 完. / 完。 keyword boundaries, snippet and unchanged indentation/block delimiters.
- Lexical hover rules and suppression in comments, strings and longer Unicode names.
- All eighteen default-expanded snippets accepted by the actual Ru checker; actual interpreter stdin/argv round-trip and explicit/natural procedure completion both returning 空 (both punctuation forms).
- VSIX ZIP integrity; no runtime npm dependencies.
- Existing trust, save/Save As, duplicate-run, failure/retry and launch argument regression tests retained.

Real VS Code 1.90.2 extension-host coverage runs in GitHub Actions for each exact commit: activation, file association, hover registration (including 完 and suppression), Chinese line/block comment toggle round-trips, terminal stdin, argv/cwd, exit status, duplicate protection and rerun. Check that commit's completed Actions result; local checks do not imply CI passed. This cloud executor previously could not create the X display required by Electron.

Native Windows/macOS UI and remote-host UI were not executed; platform command construction has unit coverage.
