# 如言 · Ru for VS Code

如言的独立 VS Code 扩展。语言实现与规范在 [uppet/ru-language](https://github.com/uppet/ru-language)，本仓库只维护编辑器支持。

## 功能

- `.ru` 文件识别与 TextMate 语法高亮：中文 / Unicode 名称、匿名 `算` / `作`、控制流、数字、两种行注释，以及四对可跨行的引号。
- 半角 / 全角括号匹配、引号补全、常见多行块的保守自动缩进。
- 函数、过程、匿名函数、条件、循环、恢复块、形、元初和竞赛模板。
- 编辑器右上角 ▶、命令面板“如言: 运行当前文件”，以及 **Ctrl+Alt+R**（macOS：**Cmd+Option+R**）。
- 在 VS Code 任务终端运行：保留 stdin、stdout、stderr 和退出状态，支持交互输入与 Ctrl+C。

对应如语言规范 **0.6.0**，参考语言仓库提交 `2f768846f1943d40af5e4ad9808ce8481c1c2a22`。扩展不包含解释器；没有 LSP、语义诊断、补全服务或调试器。

## 安装

1. 在扩展视图的 `…` 菜单选择 **Install from VSIX…**，选择 `ru-vscode-0.1.0.vsix`。
2. 安装 Python 3.10+，准备如言工具链。
3. 在设置中搜索 `ru.cliPath`，设为语言仓库根目录的 **ru 文件**的绝对路径，而不是目录、`ru.cmd` 或 Python 文件夹。

例如用户设置：

```json
{
  "ru.interpreterPath": "python3",
  "ru.cliPath": "/Users/me/Projects/ru-language/ru"
}
```

Windows 示例：

```json
{
  "ru.interpreterPath": "C:\\Python312\\python.exe",
  "ru.cliPath": "C:\\Projects\\ru-language\\ru"
}
```

若该 Python 环境已能执行 `python3 -m rulang`，`ru.cliPath` 可以留空。Windows 默认解释器名为 `python`，其他系统为 `python3`。路径不要额外加 shell 引号；空格和中文原样填写。扩展不会从源码目录自动寻找或执行一个叫 `ru` 的文件。

## 运行与输入

打开 `.ru` 后按快捷键。未保存 / 新建文档会先询问“保存并运行”；取消保存就取消运行，不执行磁盘上的旧版本。默认相当于：

```text
python3 -u /absolute/path/to/ru run /absolute/path/to/current.ru
```

使用 VS Code 的 `ProcessExecution` 传递独立参数，不拼接 shell 命令。同一文件仍在运行时，再按快捷键会提示先结束现有任务，不重复创建进程，也不把命令误送入正在读取的 stdin。结束后可再次运行，复用该文件的任务终端。不同文件可并行运行。

终端自动获得焦点。逐行输入后按 Enter；需要读到 EOF 的竞赛程序，在 macOS / Linux 空行按 Ctrl+D，Windows 通常按 Ctrl+Z 后 Enter（具体由终端决定）。Ctrl+C 中断程序，也可使用终端垃圾桶 / **Tasks: Terminate Task**。`读入` 会读取剩余标准输入，可能要发送 EOF 才开始输出；`蓄出` 最后须显式 `出 其 清.`。

退出后的结果留在终端。找不到 Python / rulang 的错误也在终端显示；修正解释器或 CLI 路径，再运行即可。

## 设置

| 设置 | 默认 | 用途 |
| --- | --- | --- |
| `ru.interpreterPath` | 空 | Python 可执行文件；空值采用平台默认名 |
| `ru.interpreterArguments` | `["-u"]` | Python 前置参数，逐项传递 |
| `ru.cliPath` | 空 | `ru` 脚本路径；空值使用 `-m rulang` |
| `ru.workingDirectory` | `${fileDirname}` | 程序的工作目录 |
| `ru.programArguments` | `[]` | `--` 后传入元初的参数，逐项传递 |

路径设置支持 `${fileDirname}` 和 `${workspaceFolder}`（当前文件所在的工作区文件夹）。相对路径基于该工作区文件夹；无工作区时基于当前文件目录。未打开工作区却引用 `${workspaceFolder}` 会明确报错。参数数组不展开变量，也不解释 shell 表达式。由于 VS Code 任务本身会解析 `${...}`，包含这种字面串的文件名或参数会被明确拒绝（不会替你展开或执行它）；请先重命名文件或去掉该参数。

如程序需要从项目根目录读取数据，可设置 `ru.workingDirectory` 为 `${workspaceFolder}`。远程 SSH / WSL / 容器场景中，解释器与路径都属于运行扩展的远程环境，而不是本机。

## 边界与安全

高亮是词法辅助，不等于编译检查。`终` 只在独立行结束词形式中着色，其他位置按普通名称处理；无完整语法树时无法证明它正处于恢复块中。自动缩进偏保守；多行头部、跨行字符串及复杂单行嵌套可能需要手动调整。`为` 同时用于类型、转换与过程结束，因此不把关键字冒充括号匹配。

运行命令只在受信任工作区可用，激活、编辑和打开文件不会执行代码。仅支持扩展宿主文件系统上的已保存文件；不支持浏览器版 VS Code 或只读虚拟文件系统的运行。执行用户源码本身可能读写文件或发起网络操作，运行前请审阅。扩展没有遥测、自动下载解释器、联网生成或后台运行。

## 开发与验证

需要 Node.js 22+：

```sh
npm ci --ignore-scripts
npm run lint
npm test
npm run package
# 可选：对另一个仓库的真实如工具链验证十个模板与 stdin / argv
RU_LANGUAGE_ROOT=/path/to/ru-language npm run test:ru
# 真实 VS Code 扩展宿主测试；Linux 需要显示服务器
xvfb-run -a npm run test:integration
```

`npm test` 使用真实 TextMate / Oniguruma 检查高亮，检查命令参数与模拟 VS Code API 的保存、信任、重复运行和失败恢复路径。集成测试启动真实 VS Code 1.90.2，验证激活、文件关联、终端 stdin、特殊字符 argv、工作目录、退出码与再次运行；使用受控 Python CLI 夹具，不依赖另一个私有仓库的授权。可通过 `VSCODE_VERSION=stable` 验证当前稳定版。

CI 在 Ubuntu 上执行以上检查并保存 VSIX 构件。F5 可启动 Extension Development Host。开发依据：[VS Code API](https://code.visualstudio.com/api/references/vscode-api)、[语法高亮](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)、[工作区信任](https://code.visualstudio.com/api/extension-guides/workspace-trust)、[扩展测试](https://code.visualstudio.com/api/working-with-extensions/testing-extension)。

本仓库为私有项目，没有 Marketplace 自动发布流程。
