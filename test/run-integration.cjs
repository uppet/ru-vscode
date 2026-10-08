const path = require('node:path');
const fs = require('node:fs');
const { runTests } = require('@vscode/test-electron');
const root = path.resolve(__dirname, '..');
const workspace = path.join(root, '.vscode-test', 'workspace');
fs.mkdirSync(workspace, { recursive: true });
runTests({ version: process.env.VSCODE_VERSION || '1.90.2',
    extensionDevelopmentPath: root, extensionTestsPath: path.join(__dirname, 'integration.cjs'),
    launchArgs: [workspace, '--disable-extensions', '--disable-workspace-trust', '--skip-welcome', '--skip-release-notes', '--disable-gpu', '--no-sandbox'],
    extensionTestsEnv: { RU_TEST_WORKSPACE: workspace }
}).catch(error => { console.error(error); process.exitCode = 1; });
