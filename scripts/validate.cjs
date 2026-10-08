const assert = require('node:assert/strict');
const fs = require('node:fs');
const pkg = require('../package.json');
for (const file of ['syntaxes/ru.tmLanguage.json', 'snippets/ru.json', 'language-configuration.json']) JSON.parse(fs.readFileSync(file, 'utf8'));
assert.equal(pkg.private, true);
assert.equal(pkg.main, './out/extension.js');
assert.equal(pkg.contributes.commands[0].command, 'ru.runFile');
assert.equal(pkg.capabilities.untrustedWorkspaces.supported, 'limited');
assert.deepEqual(pkg.capabilities.untrustedWorkspaces.restrictedConfigurations.sort(), Object.keys(pkg.contributes.configuration.properties).sort());
assert.ok(!pkg.scripts.publish, 'No marketplace publishing script.');
for (const snippet of Object.values(require('../snippets/ru.json'))) {
    assert.ok(Array.isArray(snippet.body) && snippet.body.length);
    assert.ok(snippet.description);
}
console.log('Manifest, grammar, configuration, and snippets validated.');
