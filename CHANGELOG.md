# Changelog

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
