# Comment Translate AI

支持大模型调用的 VSCode 代码注释翻译插件，作为 [Comment Translate](https://marketplace.visualstudio.com/items?itemName=intellsmi.comment-translate) 的翻译源扩展

⚠️*本插件不提供大模型API，请自备API，并确保其支持OpenAI的API的调用格式*

[**简体中文**](README.md)|[English](README_en.md)

## ✨ 特性

- 🤖 采用OpenAI的API调用规范
- 🎯 对函数、类、变量等参数的智能命名，按照命名规则优化命名
- ⌨️ 自定义提示词
- ⚡ 快速的翻译响应
- 🛠️ 灵活的配置选项

## 📦 安装

1. 安装 [Comment Translate](https://marketplace.visualstudio.com/items?itemName=intellsmi.comment-translate)
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

1. 配置 API 相关信息，请确保您使用的大模型服务商兼容OpenAI的API调用格式
   [Open AI官方文档](https://platform.openai.com/docs/api-reference/chat)
   *中国大陆地区推荐使用[DeepSeek](https://platform.deepseek.com/)
   不是广告，因为这个模型效果好而且token便宜推荐一下*
   ![配置](./image/setting.png)
2. 配置完成后，请调用“Comment Translate”中的“Comment Translate:Change translate source”命令
   ![换源](./image/change.png)
3. 选择翻译源为"AI translate"
   ![选择](./image/select.png)

### 怎么使用"AI命名"

* 右键鼠标→在列表中选择"注释翻译"→点击"AI命名"即可使用
* 将命名按照所选的命名格式翻译成英文
* 按照命名格式优化命名
  ![AI命名](./image/AI%20Naming.gif)

### 自定义AI提示词

*提示词中必须包含以下参数，参数内容由插件自动获取*

**自定义命名提示词**

| 参数                               | 说明                                      |      |
| ---------------------------------- | ----------------------------------------- | ---- |
| ${variableName}                    | 当前正在处理的变量名                      | 必填 |
| ${paragraph}                       | 变量所在的段落                            | 必填 |
| ${languageId}                      | 当前文件的语言标识                        | 必填 |
| ${this._defaultOption.namingRules} | 命名规则(由Ai Translate:Naming Rules控制) | 选填 |

```
示例:请根据 ${languageId} 判断 "${paragraph}" 中的 "${variableName}" 是类名、方法名、函数名还是其他类型。
然后，根据 ${languageId} 的标准规范和命名规则 "${this._defaultOption.namingRules}"，将 "${variableName}" 翻译为英文，使用专业术语，并直接返回 "${variableName}" 的翻译结果，无需任何解释或特殊符号。
```

**自定义翻译提示词**

| 参数          | 说明             |      |
| ------------- | ---------------- | ---- |
| ${targetLang} | 翻译时的目标语言 | 必填 |
| ${content}    | 需要翻译的内容   | 必填 |

```
示例:请充当翻译员，检查句子或词语是否准确，翻译自然、流畅且符合习惯用法，使用专业的计算机术语以确保注释或功能的准确翻译，无需添加不必要的内容。将以下文本翻译成${targetLang}：\n${content}`
```

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

### 0.0.5

- 🔍 在插件设置里面添加了"调试功能"

### 0.0.6

- 🤖 优化了AI提示词

### 0.0.7

- ✨ 添加了自定义AI提示词功能 [#1](https://github.com/Cheng-MaoMao/comment-translate-ai/issues/1)

## 🙏 致谢

本项目基于以下优秀的开源项目开发：

- [vscode-comment-translate](https://github.com/intellism/vscode-comment-translate) - VSCode 注释翻译插件
- [deepl-translate](https://github.com/intellism/deepl-translate) - DeepL 翻译扩展，本项目的基础代码来源

特别感谢：

- [@intellism](https://github.com/intellism) 提供的优秀插件框架和参考实现

## 📄 许可证说明

本项目采用 [MIT License](LICENSE) 许可证。

部分代码修改自 [deepl-translate](https://github.com/intellism/deepl-translate)，遵循其 MIT 许可证。
