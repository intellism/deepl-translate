# Comment Translate AI

A VSCode code comment translation plugin that supports large model invocation, serving as a translation source extension for [Comment Translate](https://github.com/intellism/vscode-comment-translate)

[简体中文](README.md)|[**English**](README_en.md)

## ✨ Features

- 🤖 Adopts OpenAI API standards
- 🎯 Intelligent naming of parameters such as functions, classes, and variables, optimizing names according to naming conventions
- ⚡ Fast translation response
- 🛠️ Flexible configuration options

## 📦 Installation

1. Install [Comment Translate](https://github.com/intellism/vscode-comment-translate)
2. Install this extension[Comment Translate for AI](https://marketplace.visualstudio.com/items?itemName=Cheng-MaoMao.ai-powered-comment-translate-extension&ssr=false#overview)
3. Open the command palette in VS Code (Ctrl+Shift+P)
4. Type "Comment Translate: Change translation source"
5. Select "AI Translate" as the translation source

## ⚙️ Configuration

Configure the following options in VS Code settings:

|                Option                |                                                                   Description                                                                   |               Default               |
| :-----------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------: | :----------------------------------: |
|     `aiTranslate.largeModelApi`     |                                                             Large model API endpoint                                                             |                  -                  |
|     `aiTranslate.largeModelKey`     |                                                                     API key                                                                     |                  -                  |
|    `aiTranslate.largeModelName`    |                                                                    Model name                                                                    |                  -                  |
|  `aiTranslate.largeModelMaxTokens`  |                                                        Maximum tokens (0 means unlimited)                                                        |                 2048                 |
| `aiTranslate.largeModelTemperature` | The temperature parameter of a large model<br />(a lower value produces more certain results, while a higher value yields more diverse outcomes) |                 0.2                 |
|      `aiTranslate.namingRules`      |                                                                Naming Conventions                                                                | Translation: Determined by AI itself |

## 🚀 Quick Start

1. Configure API-related information, ensuring it is in a format compatible with OpenAI's API standards
   ![配置](./image/setting.png)
2. Once configuration is complete, please execute the "Comment Translate" command from the "Comment Translate:Change translate source" section
   ![换源](./image/change.png)
3. Select "AI translate" as the translation source
   ![选择](./image/select.png)
4. **How to use "AI Naming":**Right-click the mouse→Select "Comment Translation" from the list→Click "AI Naming" to use it

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📝 Changelog

### 0.0.1

- 🎉 Initialize project
- ✨ Implement basic translation
- 🔧 Add configuration options

### 0.0.2

- 🔧 Modify setting name

### 0.0.3

- 🔧 Add Model Temperature setting

### 0.0.4

- 🤖 Add an AI naming feature that allows the AI to intelligently assign names to parameters such as variables, functions, and classes based on your settings or its own judgment
- 🌐 Added configuration files for multilingual environments

## 🙏 Acknowledgments

This project is developed based on the following excellent open-source projects:

- [vscode-comment-translate](https://github.com/intellism/vscode-comment-translate) - VSCode comment translation extension
- [deepl-translate](https://github.com/intellism/deepl-translate) - DeepL translation extension, the source of our base code

Special thanks to:

- [@intellism](https://github.com/intellism) for providing the excellent plugin framework and reference implementation

## 📄 License

This project is licensed under the [MIT License](LICENSE).

Some code is modified from [deepl-translate](https://github.com/intellism/deepl-translate), following its MIT license.
