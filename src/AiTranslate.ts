import axios from 'axios'; // 导入 axios 库，用于发送 HTTP 请求
import * as vscode from 'vscode'; // 导入 VS Code 的所有模块
import { workspace, window } from 'vscode'; // 从 VS Code 导入 workspace 和 window 模块
import { ITranslate, ITranslateOptions } from 'comment-translate-manager'; // 导入 ITranslate 和 ITranslateOptions 接口

const PREFIXCONFIG = 'aiTranslate'; // 配置前缀，用于获取 AI 翻译相关的配置
const outputChannel = vscode.window.createOutputChannel('AI Translate'); // 创建输出面板，用于显示调试信息

// 获取指定配置项的值
export function getConfig<T>(key: string): T | undefined {
    let configuration = workspace.getConfiguration(PREFIXCONFIG); // 获取 AI 翻译的配置对象
    return configuration.get<T>(key); // 返回指定的配置项的值
}

// 定义翻译选项的接口
interface TranslateOption {
    largeModelApi?: string; // 大模型 API 接口地址
    largeModelKey?: string; // 大模型 API 密钥
    largeModelName?: string; // 大模型名称
    largeModelMaxTokens?: number; // 大模型最大 token 数
    largeModelTemperature?: number; // 大模型生成多样性的温度参数
    namingRules?: string; // 命名规则
    debugMode?: boolean; // 是否启用调试模式
    customTranslatePrompt?: string; // 自定义翻译提示词
    customNamingPrompt?: string; // 自定义命名提示词
    streaming?: boolean; // 是否启用流式翻译
}

// AiTranslate 类，实现了 ITranslate 接口
export class AiTranslate implements ITranslate {
    // 翻译引擎的唯一标识符
    readonly id = 'ai-powered-comment-translate-extension';

    // 翻译引擎的名称
    readonly name = 'AI translate';

    // 最大翻译文本长度
    get maxLen(): number {
        return 3000;
    }

    private _defaultOption: TranslateOption; // 默认的翻译选项

    constructor() {
        this._defaultOption = this.createOption(); // 初始化默认选项
        // 监听配置变化事件，更新默认选项
        workspace.onDidChangeConfiguration(async eventNames => {
            if (eventNames.affectsConfiguration(PREFIXCONFIG)) {
                this._defaultOption = this.createOption(); // 更新默认翻译选项
            }
        });
    }

    // 创建翻译选项
    createOption(): TranslateOption {
        const defaultOption: TranslateOption = {
            largeModelApi: getConfig<string>('largeModelApi'), // 获取大模型 API 接口地址
            largeModelKey: getConfig<string>('largeModelKey'), // 获取大模型 API 密钥
            largeModelName: getConfig<string>('largeModelName'), // 获取大模型名称
            largeModelMaxTokens: getConfig<number>('largeModelMaxTokens'), // 获取大模型最大 token 数
            largeModelTemperature: getConfig<number>('largeModelTemperature'), // 获取大模型温度参数
            namingRules: getConfig<string>('namingRules'), // 获取命名规则
            debugMode: getConfig<boolean>('debugMode'), // 获取调试模式状态
            customTranslatePrompt: getConfig<string>('customTranslatePrompt'), // 获取自定义翻译提示词
            customNamingPrompt: getConfig<string>('customNamingPrompt'), // 获取自定义命名提示词
            streaming: getConfig<boolean>('streaming') // 获取流式翻译状态
        };
        return defaultOption;
    }

    // 将日志信息输出到调试面板
    async logToChannel(message: string) {
        if (this._defaultOption.debugMode) {
            outputChannel.show();
            outputChannel.appendLine(message);
        } else {
            outputChannel.dispose();
        }
    }

    // 检查自定义提示词的格式
    private checkCustomPrompt(type: 'translate' | 'naming', prompt: string): boolean {
        if (type === 'translate') {
            return prompt.includes('${targetLang}') && prompt.includes('${content}');
        } else {
            return prompt.includes('${variableName}') &&
                prompt.includes('${paragraph}') &&
                prompt.includes('${languageId}');
        }
    }

    // 使用大模型 API 执行翻译
    async translate(content: string, { to = 'auto' }: ITranslateOptions) {
        // 用于收集调试信息
        let debugInfo = '';

        console.log('开始翻译文本:', {
            contentLength: content.length,
            targetLang: to,
            modelName: this._defaultOption.largeModelName
        });

        debugInfo += `开始翻译文本: ${JSON.stringify({
            contentLength: content.length,
            targetLang: to,
            modelName: this._defaultOption.largeModelName
        })}\n`;

        const url = this._defaultOption.largeModelApi;

        if (!url || !this._defaultOption.largeModelKey) {
            console.error('配置错误: API信息不完整');

            debugInfo += '配置错误: API信息不完整\n';

            throw new Error('请检查 largeModelApi 和 largeModelKey 配置');
        }

        try {
            // 如果目标语言是 auto，默认翻译成中文
            const targetLang = to === 'auto' ? 'zh-CN' : to;
            const maxTokens = this._defaultOption.largeModelMaxTokens === 0 ? undefined : (this._defaultOption.largeModelMaxTokens);

            console.log('翻译配置:', {
                targetLang,
                maxTokens,
                temperature: this._defaultOption.largeModelTemperature
            });

            debugInfo += `翻译配置: ${JSON.stringify({
                targetLang,
                maxTokens,
                temperature: this._defaultOption.largeModelTemperature
            })}\n`;

            let promptContent: string;

            if (this._defaultOption.customTranslatePrompt) {
                if (!this.checkCustomPrompt('translate', this._defaultOption.customTranslatePrompt)) {
                    await window.showErrorMessage('翻译提示词格式错误：必须包含 ${targetLang} 和 ${content} 参数');
                    throw new Error('翻译提示词格式错误');
                }
                promptContent = this._defaultOption.customTranslatePrompt
                    .replace('${targetLang}', targetLang)
                    .replace('${content}', content);
            } else {
                promptContent = `Please act as a translator, check if the sentences or words are accurate, translate naturally, smoothly, and idiomatically, use professional computer terminology for accurate translation of comments or functions, no additional unnecessary additions are needed. Translate the following text into ${targetLang}:\n${content}`;
            }

            // 修改请求数据，添加 stream 参数
            const data: any = {
                model: this._defaultOption.largeModelName,
                messages: [
                    {
                        role: "user",
                        content: promptContent
                    }
                ],
                temperature: this._defaultOption.largeModelTemperature || 0.2,
                max_tokens: this._defaultOption.largeModelMaxTokens,
                stream: this._defaultOption.streaming // 使用配置中的 streaming 参数
            };

            console.log('发送翻译请求:', {
                url,
                model: data.model,
                maxTokens: data.max_tokens,
                contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
            });

            debugInfo += `发送翻译请求: ${JSON.stringify({
                url,
                model: data.model,
                messages: [
                    {
                        role: "user",
                        content: promptContent
                    }
                ],
                contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
            })}\n`;

            // 根据是否启用流式传输选择不同的处理方式
            if (this._defaultOption.streaming) {
                debugInfo += `使用流式传输模式\n`;

                // 使用流式传输模式发送请求
                const response = await axios.post(url, data, {
                    headers: {
                        'Authorization': `Bearer ${this._defaultOption.largeModelKey}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'stream',
                    timeout: 30000
                });

                // 处理流式响应
                let result = '';
                debugInfo += `开始接收流式数据\n`;

                // 创建 Promise 来处理流式数据
                const streamResult = await new Promise<string>((resolve, reject) => {
                    response.data.on('data', (chunk: Buffer) => {
                        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
                        for (const line of lines) {
                            if (line.includes('[DONE]')) {
                                continue;
                            }
                            try {
                                const jsonStr = line.replace(/^data: /, '').trim();
                                if (jsonStr) {
                                    const json = JSON.parse(jsonStr);
                                    if (json.choices[0].delta?.content) {
                                        result += json.choices[0].delta.content;
                                        debugInfo += `接收流式数据片段: ${json.choices[0].delta.content}\n`;
                                    }
                                }
                            } catch (e) {
                                debugInfo += `解析流式数据错误: ${e}\n`;
                                console.error('解析流式数据错误:', e);
                            }
                        }
                    });

                    response.data.on('end', () => {
                        debugInfo += `流式数据传输完成\n`;
                        resolve(result.trim());
                    });

                    response.data.on('error', (err: Error) => {
                        debugInfo += `流式数据传输错误: ${err.message}\n`;
                        reject(err);
                    });
                });

                // 输出调试信息
                this.logToChannel(debugInfo);
                return streamResult;

            } else {
                debugInfo += `使用普通请求模式\n`;
                // 原有的非流式处理逻辑
                const res = await axios.post(url, data, {
                    headers: {
                        'Authorization': `Bearer ${this._defaultOption.largeModelKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                });

                console.log('收到翻译响应:', {
                    status: res.status,
                    hasChoices: !!res.data?.choices?.length
                });

                debugInfo += `收到翻译响应: ${JSON.stringify({
                    status: res.status,
                    hasChoices: !!res.data?.choices?.length
                })}\n`;

                if (!res.data?.choices?.[0]?.message?.content) {
                    console.error('API响应格式错误:', JSON.stringify(res.data, null, 2));

                    debugInfo += `API响应格式错误: ${JSON.stringify(res.data, null, 2)}\n`;

                    throw new Error('API响应格式不符合标准');
                }

                const result = res.data.choices[0].message.content.trim();
                console.log('翻译完成:', {
                    resultLength: result.length,
                    preview: result.substring(0, 100) + (result.length > 100 ? '...' : '')
                });

                debugInfo += `翻译完成: ${JSON.stringify({
                    resultLength: result.length,
                    preview: result.substring(0, 100) + (result.length > 100 ? '...' : '')
                })}\n`;

                // 输出调试信息
                this.logToChannel(debugInfo);

                return result;
            }

        } catch (error: any) {
            console.error('翻译失败:', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            debugInfo += `翻译失败: ${JSON.stringify({
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            })}\n`;

            // 输出调试信息
            this.logToChannel(debugInfo);

            throw new Error(`翻译失败: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    // AI命名方法
    async aiNaming(variableName: string, languageId: string): Promise<string> {
        const editor = vscode.window.activeTextEditor;
        // 用于收集调试信息
        let debugInfo = '';

        if (!editor) {
            debugInfo += '未找到活动编辑器\n';
            throw new Error('未找到活动编辑器');
        }

        // 获取选中文本的范围
        const selection = editor.selection;

        // 获取变量所在的完整段落文本
        const paragraph = await this.getVariableParagraph(editor.document, selection.start.line);
        console.log('变量所在段落:', paragraph);

        debugInfo += `变量所在段落: ${paragraph}\n`;

        // 开始 AI 命名逻辑
        console.log('开始AI命名:', {
            variableName,
            languageId,
            modelName: this._defaultOption.largeModelName
        });

        debugInfo += `开始AI命名: ${JSON.stringify({
            variableName,
            languageId,
            modelName: this._defaultOption.largeModelName
        })}\n`;

        const url = this._defaultOption.largeModelApi;

        if (!url || !this._defaultOption.largeModelKey) {
            debugInfo += '配置错误: API信息不完整\n';
            throw new Error('请配置 API 相关信息');
        }

        let promptContent: string;

        if (this._defaultOption.customNamingPrompt) {
            if (!this.checkCustomPrompt('naming', this._defaultOption.customNamingPrompt)) {
                await window.showErrorMessage('命名提示词格式错误：必须包含 ${variableName}、${paragraph}、${languageId} 参数');
                throw new Error('命名提示词格式错误');
            }
            promptContent = this._defaultOption.customNamingPrompt
                .replace(/\${variableName}/g, variableName)
                .replace('${paragraph}', paragraph)
                .replace('${languageId}', languageId);
        } else if (this._defaultOption.namingRules == "default") {
            promptContent = `Please determine whether "${variableName}" in "${paragraph}" is a class name, method name, function name, or other based on ${languageId}. Then, according to the standard naming conventions of ${languageId}, translate "${variableName}" into English using professional language, and directly return the translated result of "${variableName}" without any explanation or special symbols.`;
        } else {
            promptContent = `Please determine whether "${variableName}" in "${paragraph}" is a class name, method name, function name, or other based on ${languageId}. Then, according to the standard specifications of ${languageId} and the naming rules "${this._defaultOption.namingRules}", translate "${variableName}" into English using professional language, and directly return the translated result of "${variableName}" without any explanation or special symbols.`;
        }

        try {

            const data: any = {
                model: this._defaultOption.largeModelName,
                messages: [
                    {
                        role: "user",
                        content: promptContent
                    }
                ],
                temperature: this._defaultOption.largeModelTemperature || 0.2,
                max_tokens: this._defaultOption.largeModelMaxTokens,
                stream: this._defaultOption.streaming // 添加流式传输配置
            };

            data['max_tokens'] = this._defaultOption.largeModelMaxTokens;

            // 添加流式处理逻辑
            if (this._defaultOption.streaming) {
                debugInfo += `使用流式传输模式进行命名\n`;

                const response = await axios.post(url, data, {
                    headers: {
                        'Authorization': `Bearer ${this._defaultOption.largeModelKey}`,
                        'Content-Type': 'application/json'
                    },
                    responseType: 'stream',
                    timeout: 30000
                });

                let result = '';
                debugInfo += `开始接收流式数据\n`;

                const streamResult = await new Promise<string>((resolve, reject) => {
                    response.data.on('data', (chunk: Buffer) => {
                        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
                        for (const line of lines) {
                            if (line.includes('[DONE]')) continue;
                            try {
                                const jsonStr = line.replace(/^data: /, '').trim();
                                if (jsonStr) {
                                    const json = JSON.parse(jsonStr);
                                    if (json.choices[0].delta?.content) {
                                        result += json.choices[0].delta.content;
                                        debugInfo += `接收流式数据片段: ${json.choices[0].delta.content}\n`;
                                    }
                                }
                            } catch (e) {
                                debugInfo += `解析流式数据错误: ${e}\n`;
                                console.error('解析流式数据错误:', e);
                            }
                        }
                    });

                    response.data.on('end', () => {
                        debugInfo += `流式数据传输完成\n`;
                        resolve(result.trim());
                    });

                    response.data.on('error', (err: Error) => {
                        debugInfo += `流式数据传输错误: ${err.message}\n`;
                        reject(err);
                    });
                });

                this.logToChannel(debugInfo);
                return streamResult;

            } else {
                debugInfo += `使用普通请求模式进行命名\n`;

                const res = await axios.post(url, data, {
                    headers: {
                        'Authorization': `Bearer ${this._defaultOption.largeModelKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000
                });

                console.log('收到命名响应:', {
                    status: res.status,
                    data: res.data
                });

                debugInfo += `收到命名响应: ${JSON.stringify({
                    status: res.status,
                    data: res.data
                })}\n`;

                if (!res.data?.choices?.[0]?.message?.content) {
                    console.error('API响应格式不符合标准:', res.data);

                    debugInfo += `API响应格式不符合标准: ${JSON.stringify(res.data)}\n`;

                    throw new Error('API响应格式不符合标准');
                }

                const result = res.data.choices[0].message.content.trim();
                console.log('命名完成:', result);

                // 输出调试信息
                this.logToChannel(debugInfo);
                return result;
            }
        } catch (error: any) {
            console.error('变量命名失败:', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            debugInfo += `变量命名失败: ${JSON.stringify({
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            })}\n`;

            // 输出调试信息
            this.logToChannel(debugInfo);

            throw new Error(`变量名翻译失败: ${error.message}`);
        }
    }

    // 生成链接方法，用于返回翻译后的结果链接
    link(content: string, { to = 'auto' }: ITranslateOptions): string {
        return content; // 由于使用 API 翻译，无需返回链接，直接返回原文
    }

    // 判断是否支持指定的源语言
    isSupported(src: string): boolean {
        return true; // 支持所有语言
    }

    // 获取变量所在的完整段落文本
    async getVariableParagraph(document: vscode.TextDocument, lineNumber: number): Promise<string> {
        // 获取当前行的文本
        const currentLine = document.lineAt(lineNumber);
        // 仅返回当前行的文本内容
        return currentLine.text.trim();
    }
}