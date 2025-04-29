import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import * as vscode from 'vscode';
import { workspace, window } from 'vscode';
import { ITranslate, ITranslateOptions } from 'comment-translate-manager';

const PREFIXCONFIG = 'aiTranslate';

// 获取指定配置项的值
export function getConfig<T>(key: string): T | undefined {
    let configuration = workspace.getConfiguration(PREFIXCONFIG); // 获取 AI 翻译的配置对象
    return configuration.get<T>(key); // 返回指定的配置项的值
}

// 定义翻译选项的接口
interface TranslateOption {
    modelType?: 'OpenAI' | 'Gemini';
    largeModelApi?: string; // 仅 OpenAI 模式使用
    largeModelKey: string;
    largeModelName?: string;
    largeModelMaxTokens?: number; // 仅 OpenAI 模式使用
    largeModelTemperature?: number; // 仅 OpenAI 模式使用
    namingRules?: string;
    customTranslatePrompt?: string;
    customNamingPrompt?: string;
    streaming?: boolean; // 仅 OpenAI 模式使用
    filterThinkingContent?: boolean; // 是否过滤深度思考内容
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

    // 实现link方法（来自ITranslate接口）
    link(content: string, { to = 'auto' }: ITranslateOptions): string {
        return content; // 由于使用 API 翻译，无需返回链接，直接返回原文
    }

    private _defaultOption: TranslateOption; // 默认的翻译选项

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

    // 获取变量所在的完整段落文本
    async getVariableParagraph(document: vscode.TextDocument, lineNumber: number): Promise<string> {
        // 获取当前行的文本
        const currentLine = document.lineAt(lineNumber);
        // 仅返回当前行的文本内容
        return currentLine.text.trim();
    }

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
            modelType: getConfig<'OpenAI' | 'Gemini'>('modelType'),
            largeModelApi: getConfig<string>('largeModelApi'),
            largeModelKey: getConfig<string>('largeModelKey'),
            largeModelName: getConfig<string>('largeModelName'),
            largeModelMaxTokens: getConfig<number>('largeModelMaxTokens'),
            largeModelTemperature: getConfig<number>('largeModelTemperature'),
            namingRules: getConfig<string>('namingRules'),
            customTranslatePrompt: getConfig<string>('customTranslatePrompt'),
            customNamingPrompt: getConfig<string>('customNamingPrompt'),
            streaming: getConfig<boolean>('streaming'),
            filterThinkingContent: getConfig<boolean>('filterThinkingContent')
        };
        return defaultOption;
    }

    // 过滤深度思考内容
    private filterThinkingContent(text: string): string {
        if (!this._defaultOption.filterThinkingContent) {
            return text;
        }

        // 保留常用大模型输出的思考内容过滤规则

        // 移除<thinking>...</thinking>标签及其内容
        text = text.replace(/<thinking>[\s\S]*?<\/thinking>/g, '');

        // 移除以"> Reasoning"开头并以"Reasoned for xx seconds"结束的文本块
        text = text.replace(/> Reasoning[\s\S]*?Reasoned for\s*\d+\s*seconds/g, '');

        // 移除多余的空行
        text = text.replace(/\n{3,}/g, '\n\n');

        return text.trim();
    }

    // 使用大模型 API 执行翻译
    async translate(content: string, { to = 'auto' }: ITranslateOptions) {
        try {
            if (!this._defaultOption.largeModelKey) {
                throw new Error('请配置 API Key');
            }

            const targetLang = to === 'auto' ? 'zh-CN' : to;
            let promptContent: string;

            if (this._defaultOption.customTranslatePrompt) {
                if (!this.checkCustomPrompt('translate', this._defaultOption.customTranslatePrompt)) {
                    throw new Error('翻译提示词格式错误：必须包含 ${targetLang} 和 ${content} 参数');
                }
                promptContent = this._defaultOption.customTranslatePrompt
                    .replace('${targetLang}', targetLang)
                    .replace('${content}', content);
            } else {
                promptContent = `请充当翻译，检查句子或单词是否准确，自然、流畅、习惯地翻译，使用专业的计算机术语以准确翻译注释或功能，将以下文本翻译成${targetLang}:\n${content}
            注意：不需要添加额外的解释说明，直接返回翻译内容。`;
            }

            if (this._defaultOption.modelType === 'OpenAI') {
                let url = `${this._defaultOption.largeModelApi}/chat/completions`.replace(/\/+/g, '/');

                const data = {
                    model: this._defaultOption.largeModelName,
                    messages: [{
                        role: "user",
                        content: promptContent
                    }],
                    temperature: this._defaultOption.largeModelTemperature || 0.5,
                    max_tokens: this._defaultOption.largeModelMaxTokens,
                    stream: this._defaultOption.streaming
                };

                const headers = {
                    'Authorization': `Bearer ${this._defaultOption.largeModelKey}`,
                    'Content-Type': 'application/json'
                };

                if (this._defaultOption.streaming) {
                    const response = await axios.post(url, data, {
                        headers,
                        responseType: 'stream',
                        timeout: 30000
                    });

                    let result = '';
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
                                        }
                                    }
                                } catch (e) {
                                    console.error('解析流式数据错误:', e);
                                }
                            }
                        });

                        response.data.on('end', () => resolve(result.trim()));
                        response.data.on('error', (err: Error) => reject(err));
                    });

                    return this.filterThinkingContent(streamResult);
                } else {
                    const res = await axios.post(url, data, {
                        headers,
                        timeout: 30000
                    });

                    if (!res.data?.choices?.[0]?.message?.content) {
                        throw new Error('API响应格式不符合标准');
                    }
                    return this.filterThinkingContent(res.data.choices[0].message.content.trim());
                }
            } else { // Gemini 模式
                const genAI = new GoogleGenerativeAI(this._defaultOption.largeModelKey);
                const model = genAI.getGenerativeModel({
                    model: this._defaultOption.largeModelName || "gemini-2.0-flash"
                });

                const result = await model.generateContent({
                    contents: [{
                        role: "user",
                        parts: [{ text: promptContent }]
                    }]
                });

                const response = await result.response;
                if (!response.text()) {
                    throw new Error('Gemini API 返回内容为空');
                }
                return this.filterThinkingContent(response.text().trim());
            }
        } catch (error: any) {
            window.showErrorMessage(`翻译失败: ${error.message}`);
            throw error;
        }
    }

    // AI命名方法
    async aiNaming(variableName: string, languageId: string): Promise<string> {
        try {
            if (!this._defaultOption.largeModelKey) {
                throw new Error('请配置 API Key');
            }

            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                throw new Error('未找到活动编辑器');
            }

            const selection = editor.selection;
            const paragraph = await this.getVariableParagraph(editor.document, selection.start.line);

            let promptContent: string;
            if (this._defaultOption.customNamingPrompt) {
                if (!this.checkCustomPrompt('naming', this._defaultOption.customNamingPrompt)) {
                    throw new Error('命名提示词格式错误：必须包含 ${variableName}、${paragraph}、${languageId} 参数');
                }
                promptContent = this._defaultOption.customNamingPrompt
                    .replace(/\${variableName}/g, variableName)
                    .replace('${paragraph}', paragraph)
                    .replace('${languageId}', languageId);
            } else if (this._defaultOption.namingRules == "default") {
                promptContent = `请根据"${languageId}"确定"${paragraph}"中的"${variableName}"是类名、方法名、函数名还是其他。然后，根据"${languageId}"的命名规范，使用专业术语将"${variableName}"翻译成英文，并直接返回"${variableName}"的翻译结果。
            注意：不需要添加额外的解释说明，直接返回翻译内容。`;
            } else {
                promptContent = `请根据"${languageId}"确定"${paragraph}"中的"${variableName}"是类名、方法名、函数名还是其他。然后，根据"${languageId}"的标准规范和命名规则"${this._defaultOption.namingRules}"，将"${variableName}"翻译成专业的英文，并直接返回"${variableName}"的翻译结果。
            注意：不需要添加额外的解释说明，直接返回翻译内容。`;
            }

            if (this._defaultOption.modelType === 'OpenAI') {
                let url = `${this._defaultOption.largeModelApi}/chat/completions`.replace(/\/+/g, '/');

                const data = {
                    model: this._defaultOption.largeModelName,
                    messages: [{
                        role: "user",
                        content: promptContent
                    }],
                    temperature: this._defaultOption.largeModelTemperature || 0.5,
                    max_tokens: this._defaultOption.largeModelMaxTokens,
                    stream: this._defaultOption.streaming
                };

                const headers = {
                    'Authorization': `Bearer ${this._defaultOption.largeModelKey}`,
                    'Content-Type': 'application/json'
                };

                if (this._defaultOption.streaming) {
                    const response = await axios.post(url, data, {
                        headers,
                        responseType: 'stream',
                        timeout: 30000
                    });

                    let result = '';
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
                                        }
                                    }
                                } catch (e) {
                                    console.error('解析流式数据错误:', e);
                                }
                            }
                        });

                        response.data.on('end', () => resolve(result.trim()));
                        response.data.on('error', (err: Error) => reject(err));
                    });

                    return this.filterThinkingContent(streamResult);
                } else {
                    const res = await axios.post(url, data, {
                        headers,
                        timeout: 30000
                    });

                    if (!res.data?.choices?.[0]?.message?.content) {
                        throw new Error('API响应格式不符合标准');
                    }
                    return this.filterThinkingContent(res.data.choices[0].message.content.trim());
                }
            } else { // Gemini 模式
                const genAI = new GoogleGenerativeAI(this._defaultOption.largeModelKey);
                const model = genAI.getGenerativeModel({
                    model: this._defaultOption.largeModelName || "gemini-2.0-flash"
                });

                const result = await model.generateContent({
                    contents: [{
                        role: "user",
                        parts: [{ text: promptContent }]
                    }]
                });

                const response = await result.response;
                if (!response.text()) {
                    throw new Error('Gemini API 返回内容为空');
                }
                return this.filterThinkingContent(response.text().trim());
            }
        } catch (error: any) {
            window.showErrorMessage(`变量名翻译失败: ${error.message}`);
            throw error;
        }
    }
}
