import axios from 'axios'; // 导入 axios 库，用于发送 HTTP 请求
import { workspace } from 'vscode'; // 从 VS Code 导入 workspace 模块
import { ITranslate, ITranslateOptions } from 'comment-translate-manager'; // 导入接口 ITranslate 和 ITranslateOptions

const PREFIXCONFIG = 'aiTranslate'; // 配置前缀，用于获取翻译相关的配置

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
            largeModelMaxTokens: getConfig<number>('largeModelMaxTokens') // 获取大模型最大 token 数的配置
        };
        return defaultOption;
    }

    // 使用大模型 API 执行翻译
    async translate(content: string, { to = 'auto' }: ITranslateOptions) {
        const url = this._defaultOption.largeModelApi;

        if (!url || !this._defaultOption.largeModelKey || !this._defaultOption.largeModelName) {
            throw new Error('请检查 largeModelApi、largeModelKey、largeModelName 配置是否正确');
        }

        try {
            const targetLang = to === 'auto' ? 'zh-CN' : to;
            const maxTokens = this._defaultOption.largeModelMaxTokens === 0 ? undefined : (this._defaultOption.largeModelMaxTokens || 2048);

            // 按照标准格式构建请求数据
            const data = {
                model: this._defaultOption.largeModelName,
                messages: [
                    {
                        role: "user",
                        content: `请担任翻译官，请检查语句或单词是否准确，请翻译得自然、流畅和地道，使用专业的计算机术语对注释或函数进行准确的翻译，不需要进行其它多余的添加。将下面的文字翻译成 ${targetLang}:\n${content}`
                    }
                ],
                temperature: 0.2,
                stream: false
            };

            if (maxTokens) {
                data['max_tokens'] = maxTokens;
            }

            const res = await axios.post(url, data, {
                headers: {
                    'Authorization': `Bearer ${this._defaultOption.largeModelKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });

            if (!res.data?.choices?.[0]?.message?.content) {
                console.error('API详细返回数据:', JSON.stringify(res.data, null, 2));
                throw new Error('API响应格式不符合标准');
            }

            return res.data.choices[0].message.content.trim();
        } catch (error: any) {
            console.error("翻译错误详细信息:", {
                error: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    headers: error.config?.headers,
                    data: error.config?.data
                }
            });
            throw new Error(`翻译失败: ${error.response?.data?.error?.message || error.message}`);
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
}