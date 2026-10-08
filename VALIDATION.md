# Validation — 0.1.0

Verified 2026-10-08 against Ru 0.6.0 / language commit `2f768846f1943d40af5e4ad9808ce8481c1c2a22`.

Passed locally:

- Strict TypeScript build and manifest/configuration validation (`npm run lint`).
- 22 tests: real TextMate/Oniguruma grammar, Unicode boundaries, quotes/escapes/comments/numbers, named/anonymous functions, indentation, process arguments/path handling, workspace trust, save cancellation and Save As replacement, duplicate execution, launch failure and retry, VS Code task-variable rejection.
- All ten default-expanded snippets accepted by the actual Ru checker.
- Actual Ru interpreter round-trip for Chinese/space/shell-metacharacter file names and argv, plus stdin.
- VSIX build and ZIP integrity validation. Runtime has no npm dependencies.
- npm audit: zero vulnerabilities, including development dependencies.
- Independent code review; fixed Save As document replacement and task-variable interpolation findings.

Not verified locally:

- Real VS Code extension-host test attempted with VS Code 1.90.2 twice. The cloud executor prohibits X display/socket creation, so Electron could not initialize its platform. This is an environment block, not a passing test. CI includes `xvfb-run -a npm run test:integration` to verify activation, file association, terminal input, process argv/cwd, exit status, duplicate-run protection and rerun.
- Native Windows/macOS UI behavior and screenshots. Windows command construction has automated tests but was not executed on Windows.
- Remote CI status is recorded in GitHub Actions for each exact commit; local checks do not imply a CI pass.
