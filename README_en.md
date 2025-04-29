# Comment Translate AI

A VSCode code comment translation plugin that supports large language model integration, serving as a translation source extension for [Comment Translate](https://marketplace.visualstudio.com/items?itemName=intellsmi.comment-translate)

⚠️*This plugin does not provide large language model APIs. Please use your own API and ensure it supports OpenAI's API calling format*

[简体中文](README.md)|[**English**](README_en.md)

## ✨ Features

- 🤖 Supports OpenAI and Gemini invocation methods
- 🎯 Intelligent naming of functions, classes, variables, and other parameters according to naming conventions
- ⌨️ Custom prompts
- ⚡ Fast translation response
- 🛠️ Flexible configuration options

## 📦 Installation

1. Install [Comment Translate](https://marketplace.visualstudio.com/items?itemName=intellsmi.comment-translate)
2. Install this plugin [Comment Translate for AI](https://marketplace.visualstudio.com/items?itemName=Cheng-MaoMao.ai-powered-comment-translate-extension&ssr=false#overview)
3. Open the command palette in VS Code (Ctrl+Shift+P)
4. Type "Comment Translate: Change translation source"
5. Select "AI Translate" as the translation source

## ⚙️ Configuration

Configure the following options in VS Code settings:

|                Option                |                                                                   Description                                                                   |          Default          |
| :-----------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------: | :------------------------: |
|     `aiTranslate.largeModelApi`     |                                                             Large model API endpoint                                                             |             -             |
|     `aiTranslate.largeModelKey`     |                                                                     API key                                                                     |             -             |
|    `aiTranslate.largeModelName`    |                                                                    Model name                                                                    |             -             |
|  `aiTranslate.largeModelMaxTokens`  |                                                                  Maximum tokens                                                                  |            2048            |
| `aiTranslate.largeModelTemperature` | The temperature parameter for the large model<br />(lower values produce more deterministic results, higher values produce more diverse results) |            0.5            |
|      `aiTranslate.namingRules`      |                                                                   Naming rules                                                                   | default (determined by AI) |
|       `aiTranslate.modelType`       |                                                                 Large model type                                                                 |           OpenAI           |
| `aiTranslate.filterThinkingContent` |                                                           Filter deep thinking content                                                           |           False           |

## 🚀 Quick Start

1. Configure API-related information. Please ensure that your large model service provider is compatible with OpenAI's API calling format
   [OpenAI Official Documentation](https://platform.openai.com/docs/api-reference/chat)
   *For users in mainland China, [DeepSeek](https://platform.deepseek.com/) is recommended*
   ![Configuration](./image/setting.png)
2. After configuration, call the "Comment Translate:Change translate source" command from "Comment Translate"
   ![Change source](./image/change.png)
3. Select "AI translate" as the translation source
   ![Select](./image/select.png)

### How to use "AI naming"

* Right-click → Select "Comment Translation" from the list → Click "AI naming"
* Translates names to English according to the selected naming format
* Optimizes naming according to the naming format
  ![AI naming](./image/AI%20Naming.gif)

### Custom AI prompts

*Prompts must include the following parameters, which will be automatically retrieved by the plugin*

**Custom naming prompts**

|               Parameter               |                       Description                       |          |
| :------------------------------------: | :-----------------------------------------------------: | -------- |
|          `${variableName}`          |       The variable name currently being processed       | Required |
|            `${paragraph}`            |       The paragraph where the variable is located       | Required |
|           `${languageId}`           |       The language identifier of the current file       | Required |
| `${this._defaultOption.namingRules}` | Naming rules (controlled by AI Translate: Naming Rules) | Optional |

```
Example: Please determine whether "${variableName}" in "${paragraph}" is a class name, method name, function name, or other type based on ${languageId}.
Then, according to the standard specifications and naming rules "${this._defaultOption.namingRules}" for ${languageId}, translate "${variableName}" into English using professional terminology, and directly return the translation result for "${variableName}" without any explanation or special symbols.
```

**Custom translation prompts**

|     Parameter     |             Description             |          |
| :---------------: | :---------------------------------: | -------- |
| `${targetLang}` | The target language for translation | Required |
|  `${content}`  |      Content to be translated      | Required |

```
Example: Please act as a translator, check if sentences or phrases are accurate, translate naturally, fluently and idiomatically, use professional computer terminology to ensure accurate translation of comments or functions, with no unnecessary additions. Translate the following text to ${targetLang}:\n${content}`
```

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📝 Changelog

### 0.0.1

- 🎉 Initialize project
- ✨ Implement basic translation functionality
- 🔧 Add configuration options

### 0.0.2

- 🔧 Modify setting names

### 0.0.3

- 🔧 Add Model Temperature setting

### 0.0.4

- 🤖 Add AI naming feature, allowing AI to intelligently name variables, functions, classes, and other parameters based on your settings or its own judgment
- 🌐 Add configuration files for multilingual environments

### 0.0.5

- 🔍 Add "debug function" in plugin settings

### 0.0.6

- 🤖 Optimize AI prompts

### 0.0.7

- ✨ Add custom AI prompts feature [#1](https://github.com/Cheng-MaoMao/comment-translate-ai/issues/1)

### 0.0.8

- 🔧 Optimize settings interface
- 📤 Add streaming support

### 0.0.9

- 🔄 Optimize large model calling method
- ➕ Add Google Gemini large model calling method

### 1.0.0

- 🧹 Add function to remove deep thinking content from models

## 🙏 Acknowledgments

This project is developed based on the following excellent open-source projects:

- [vscode-comment-translate](https://github.com/intellism/vscode-comment-translate) - VSCode comment translation plugin
- [deepl-translate](https://github.com/intellism/deepl-translate) - DeepL translation extension, the source of our base code
- [deprecated-generative-ai-js](https://github.com/google-gemini/deprecated-generative-ai-js) - Google AI JavaScript SDK for the Gemini API

Special thanks to:

- [@intellism](https://github.com/intellism) for providing the excellent plugin framework and reference implementation

## 📄 License

This project is licensed under the [MIT License](LICENSE).

Some code is modified from [deepl-translate](https://github.com/intellism/deepl-translate), following its MIT license.
