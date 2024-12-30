import axios from 'axios'; // 导入 axios 库，用于发送 HTTP 请求
import * as vscode from 'vscode'; // 从 VS Code 导入所有模块
import { workspace, window } from 'vscode'; // 从 VS Code 导入 workspace 和 window 模块
import { ITranslate, ITranslateOptions } from 'comment-translate-manager'; // 导入接口 ITranslate 和 ITranslateOptions
import { log } from 'console';

const PREFIXCONFIG = 'aiTranslate'; // 配置前缀，用于获取翻译相关的配置
const outputChannel = vscode.window.createOutputChannel('AI Translate'); // 创建输出频道

// 获取配置项的值
export function getConfig<T>(key: string): T | undefined {
    let configuration = workspace.getConfiguration(PREFIXCONFIG); // 获取配置对象
    return configuration.get<T>(key); // 返回指定配置项的值
}

// 定义翻译选项的接口
interface TranslateOption {
    largeModelApi?: string; // 大模型 API
    largeModelKey?: string; // 大模型 KEY
    largeModelName?: string; // 大模型名称
    largeModelMaxTokens?: number; // 大模型最大 token 数
    largeModelTemperature?: number; // 大模型温度参数
    namingRules?: string; // 命名规则
    debugMode?: boolean; // 调试模式
}

// AiTranslate 类实现了 ITranslate 接口
export class AiTranslate implements ITranslate {
    // 添加翻译源 ID 属性
    readonly id = 'ai-powered-comment-translate-extension';

    // 添加翻译源名称属性
    readonly name = 'AI translate';

    // 最大翻译文本长度
    get maxLen(): number {
        return 3000;
    }

    private _defaultOption: TranslateOption; // 默认翻译选项

    constructor() {
        this._defaultOption = this.createOption(); // 初始化默认选项
        // 监听配置变化事件
        workspace.onDidChangeConfiguration(async eventNames => {
            if (eventNames.affectsConfiguration(PREFIXCONFIG)) {
                this._defaultOption = this.createOption(); // 更新默认选项
            }
        });
    }

    // 创建翻译选项
    createOption() {
        const defaultOption: TranslateOption = {
            largeModelApi: getConfig<string>('largeModelApi'), // 获取大模型 API 的配置
            largeModelKey: getConfig<string>('largeModelKey'), // 获取大模型 KEY 的配置
            largeModelName: getConfig<string>('largeModelName'), // 获取大模型名称的配置
            largeModelMaxTokens: getConfig<number>('largeModelMaxTokens'), // 获取大模型最大 token 数的配置
            largeModelTemperature: getConfig<number>('largeModelTemperature'), // 获取大模型温度参数的配置
            namingRules: getConfig<string>('namingRules'), // 获取命名规则的配置
            debugMode: getConfig<boolean>('debugMode') // 获取调试模式的配置
        };
        return defaultOption;
    }

    //创建处理日志信息函数
    async logToChannel(message) {
        if (this._defaultOption.debugMode) {
            outputChannel.show();
            outputChannel.appendLine(message);
        } else {
            outputChannel.dispose();
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
            const targetLang = to === 'auto' ? 'zh-CN' : to;
            const maxTokens = this._defaultOption.largeModelMaxTokens === 0 ? undefined : (this._defaultOption.largeModelMaxTokens || 2048);

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

            const data = {
                model: this._defaultOption.largeModelName,
                messages: [
                    {
                        role: "user",
                        content: `请担任翻译官，请检查语句或单词是否准确，请翻译得自然、流畅和地道，使用专业的计算机术语对注释或函数进行准确的翻译，不需要进行其它多余的添加。将下面的文字翻译成 ${targetLang}:\n"${content}"`
                    }
                ],
                temperature: this._defaultOption.largeModelTemperature || 0.2,
                stream: false
            };

            if (maxTokens) {
                data['max_tokens'] = maxTokens;
            }

            console.log('发送翻译请求:', {
                url,
                model: data.model,
                contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
            });

            // 在此处可继续累加 debugInfo
            debugInfo += `发送翻译请求: ${JSON.stringify({
                url,
                model: data.model,
                messages: [
                    {
                        role: "user",
                        content: `请担任翻译官，请检查语句或单词是否准确，请翻译得自然、流畅和地道，使用专业的计算机术语对注释或函数进行准确的翻译，不需要进行其它多余的添加。将下面的文字翻译成 ${targetLang}:\n"${content}"`
                    }
                ],
                contentPreview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
            })}\n`;

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

            // 统一输出调试信息
            this.logToChannel(debugInfo);

            return result;
        } catch (error: any) {
            console.error('翻译失败:', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            // 可在此处继续累加 debugInfo 并输出
            debugInfo += `翻译失败: ${JSON.stringify({
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            })}\n`;

            // 统一输出调试信息
            this.logToChannel(debugInfo);

            throw new Error(`翻译失败: ${error.response?.data?.error?.message || error.message}`);
        }
    }

    // AI命名
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

        // 获取完整段落文本
        const paragraph = await this.getVariableParagraph(editor.document, selection.start.line);
        console.log('变量所在段落:', paragraph);

        debugInfo += `变量所在段落: ${paragraph}\n`;

        // 原有的翻译逻辑
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

        let customContent: string;// 自定义发送的内容

        if (this._defaultOption.namingRules == "default") {
            customContent = `请根据${languageId}判断"${paragraph}"中的"${variableName}"是类名、方法名、函数名还是其他。然后根据${languageId}标准规范的命名规则，使用专业的语言将"${variableName}"翻译成英语，直接返回"${variableName}"翻译后的结果，不需要任何解释，不使用特殊符号。`;
        } else {
            customContent = `请根据${languageId}判断"${paragraph}"中的"${variableName}"是类名、方法名、函数名还是其他。然后根据${languageId}的标准规范和"${this._defaultOption.namingRules}"命名规则，使用专业的语言将"${variableName}"翻译成英语，直接返回"${variableName}"翻译后的结果，不需要任何解释，不使用特殊符号。`;
        }

        try {
            const maxTokens = this._defaultOption.largeModelMaxTokens === 0 ? undefined : (this._defaultOption.largeModelMaxTokens || 2048);

            const data = {
                model: this._defaultOption.largeModelName,
                messages: [
                    {
                        role: "user",
                        content: customContent
                    }
                ],
                temperature: this._defaultOption.largeModelTemperature || 0.2,
                stream: false
            };

            if (maxTokens) {
                data['max_tokens'] = maxTokens;
            }

            console.log('发送翻译请求:', {
                url,
                data
            });

            debugInfo += `发送翻译请求: ${JSON.stringify({
                url,
                data
            })}\n`;

            const res = await axios.post(url, data, {
                headers: {
                    'Authorization': `Bearer ${this._defaultOption.largeModelKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            console.log('收到翻译响应:', {
                status: res.status,
                data: res.data
            });

            debugInfo += `收到翻译响应: ${JSON.stringify({
                status: res.status,
                data: res.data
            })}\n`;

            if (!res.data?.choices?.[0]?.message?.content) {
                console.error('API响应格式不符合标准:', res.data);

                debugInfo += `API响应格式不符合标准: ${JSON.stringify(res.data)}\n`;

                throw new Error('API响应格式不符合标准');
            }

            const result = res.data.choices[0].message.content.trim();
            console.log('翻译结果:', result);

            this.logToChannel(debugInfo);
            return result;
        } catch (error: any) {
            console.error('翻译变量名失败:', {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            debugInfo += `翻译变量名失败: ${JSON.stringify({
                error: error.message,
                response: error.response?.data,
                status: error.response?.status
            })}\n`;
            this.logToChannel(debugInfo);

            throw new Error(`变量名翻译失败: ${error.message}`);
        }
    }

    // 更新链接方法
    link(content: string, { to = 'auto' }: ITranslateOptions): string {
        return content; // 由于使用 API 翻译，直接返回原文
    }

    // 支持所有语言
    isSupported(src: string): boolean {
        return true;
    }

    async getVariableParagraph(document: vscode.TextDocument, lineNumber: number): Promise<string> {
        // 获取当前行的缩进级别
        const currentLine = document.lineAt(lineNumber);
        const currentIndent = currentLine.firstNonWhitespaceCharacterIndex;

        // 只返回当前行
        return currentLine.text.trim();
    }
}