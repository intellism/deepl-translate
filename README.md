# Comment Translate AI

支持大模型调用的 VSCode 代码注释翻译插件，作为 [Comment Translate](https://github.com/intellism/vscode-comment-translate) 的翻译源扩展

[**简体中文**](README.md)|[English](README_en.md)

## ✨ 特性

- 🤖 采用OpenAI的API调用规范
- 🎯 对函数、类、变量等参数的智能命名，按照命名规则优化命名
- ⚡ 快速的翻译响应
- 🛠️ 灵活的配置选项

## 📦 安装

1. 安装 [Comment Translate](https://github.com/intellism/vscode-comment-translate)
2. 安装本插件[Comment Translate for AI](https://marketplace.visualstudio.com/items?itemName=Cheng-MaoMao.ai-powered-comment-translate-extension&ssr=false#overview)
3. 在 VS Code 中打开命令面板 (Ctrl+Shift+P)
4. 输入 "Comment Translate: Change translation source"
5. 选择 "AI Translate" 作为翻译源

## ⚙️ 配置

在 VS Code 设置中配置以下选项：

|                配置项                |                                   说明                                   |    默认值    |
| :-----------------------------------: | :----------------------------------------------------------------------: | :----------: |
|     `aiTranslate.largeModelApi`     |                             大模型 API 端点                             |      -      |
|     `aiTranslate.largeModelKey`     |                                 API 密钥                                 |      -      |
|    `aiTranslate.largeModelName`    |                                 模型名称                                 |      -      |
|  `aiTranslate.largeModelMaxTokens`  |                       最大 token 数（0表示不限制）                       |     2048     |
| `aiTranslate.largeModelTemperature` | 大模型温度参数<br />(较低的值产生更确定的结果，较高的值产生更多样的结果) |     0.2     |
|      `aiTranslate.namingRules`      |                                 命名规则                                 | 由AI自行判断 |

## 🚀 快速开始

1. 配置 API 相关信息，请使用于OpenAI 兼容的 API 格式
   ![配置](./image/setting.png)
2. 配置完成后，请调用“Comment Translate”中的“Comment Translate:Change translate source”命令
   ![换源](./image/change.png)
3. 选择翻译源为"AI translate"
   ![选择](./image/select.png)
4. **怎么使用"AI命名":**右键鼠标→在列表中选择"注释翻译"→点击"AI命名"即可使用

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📝 更新日志

### 0.0.1

- 🎉 初始化项目
- ✨ 实现基本翻译功能
- 🔧 添加配置选项

### 0.0.2

- 🔧 修改设置名称

### 0.0.3

- 🔧 添加Model Temperature设置

### 0.0.4

- 🤖 添加AI命名功能，AI可以根据你的设定或者自行判断，对变量、函数、类等参数智能命名
- 🌐 添加了多语言环境的配置文件

## 🙏 致谢

本项目基于以下优秀的开源项目开发：

- [vscode-comment-translate](https://github.com/intellism/vscode-comment-translate) - VSCode 注释翻译插件
- [deepl-translate](https://github.com/intellism/deepl-translate) - DeepL 翻译扩展，本项目的基础代码来源

特别感谢：

- [@intellism](https://github.com/intellism) 提供的优秀插件框架和参考实现

## 📄 许可证说明

本项目采用 [MIT License](LICENSE) 许可证。

部分代码修改自 [deepl-translate](https://github.com/intellism/deepl-translate)，遵循其 MIT 许可证。
