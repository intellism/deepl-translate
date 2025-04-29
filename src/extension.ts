import * as vscode from 'vscode'; // 导入 VS Code 扩展开发 API
import { languages, Diagnostic, DiagnosticCollection } from 'vscode';
import { AiTranslate } from './AiTranslate';

/**
 * 扩展激活入口
 * 在 VS Code 加载扩展时调用此方法
 * @param context 扩展上下文，用于注册命令和管理资源
 */
const translatedMessageCache = new Map<string, string>();

export function activate(context: vscode.ExtensionContext) {
    // 创建 AI 翻译实例
    const aiTranslate = new AiTranslate();

    // 监听诊断变化
    const diagnosticCollection = vscode.languages.createDiagnosticCollection();
    context.subscriptions.push(diagnosticCollection);

    vscode.languages.onDidChangeDiagnostics(async () => {
        const lang = aiTranslate['_defaultOption'].problemTranslateLang;
        if (!lang || lang === 'none') {
            diagnosticCollection.clear();
            return;
        }

        // 获取所有文档的原始诊断（只取 VSCode 默认集合，不取自定义集合）
        const allDiagnostics = vscode.languages.getDiagnostics();

        for (const [uri, diagnostics] of allDiagnostics) {
            // 只翻译 VSCode 默认诊断，不处理自定义集合
            if (!diagnostics.length) {
                diagnosticCollection.delete(uri);
                continue;
            }

            const translatedDiagnostics: Diagnostic[] = [];
            for (const diag of diagnostics) {
                // 避免重复翻译（只翻译未翻译过的）
                if ((diag as any).translated) continue;

                const cacheKey = `${diag.message}__${lang}`;
                let translatedMsg: string;
                if (translatedMessageCache.has(cacheKey)) {
                    translatedMsg = translatedMessageCache.get(cacheKey)!;
                } else {
                    try {
                        translatedMsg = await aiTranslate.translate(diag.message, { to: lang });
                        translatedMessageCache.set(cacheKey, translatedMsg);
                    } catch {
                        translatedMsg = diag.message;
                    }
                }
                const newDiag = new vscode.Diagnostic(
                    diag.range,
                    translatedMsg,
                    diag.severity
                );
                newDiag.source = diag.source;
                newDiag.code = diag.code;
                (newDiag as any).translated = true;
                translatedDiagnostics.push(newDiag);
            }
            diagnosticCollection.set(uri, translatedDiagnostics);
        }
    });

    // 注册AI命名命令
    let translateVarCommand = vscode.commands.registerCommand('aiTranslate.aiNaming', async () => {
        // 获取当前活动编辑器
        const vscode = require('vscode');
        const editor = vscode.window.activeTextEditor;

        const otherPluginConfig = vscode.workspace.getConfiguration('commentTranslate');//获取插件配置
        const someSetting = otherPluginConfig.get('source');//获取插件配置中的某个配置项

        // 判断翻译源是否为 AI 翻译
        switch (someSetting) {
            case 'Cheng-MaoMao.ai-powered-comment-translate-extension-ai-powered-comment-translate-extension':
                break;
            case 'AI translate':
                break;
            default:
                vscode.window.showInformationMessage('请将翻译源选择为AI translate');
                return;
        }

        if (!editor) return;

        // 获取选中的文本和语言类型
        const selection = editor.selection;
        const text = editor.document.getText(selection);
        const languageId = editor.document.languageId;


        try {
            // 调用 AI 翻译服务翻译变量名
            const translatedVar = await aiTranslate.aiNaming(text, languageId);
            // 替换编辑器中选中的文本
            editor.edit(editBuilder => {
                editBuilder.replace(selection, translatedVar);
            });
        } catch (error: any) {
            // 显示错误消息
            vscode.window.showErrorMessage(`变量名翻译失败: ${error.message}`);
        }
    });

    // 将命令添加到扩展上下文的订阅中，以便正确清理
    context.subscriptions.push(translateVarCommand);

    // 返回翻译源注册对象
    return {
        extendTranslate: function (registry: any) {
            // 注册 AI 翻译源
            registry('ai-powered-comment-translate-extension', AiTranslate);
        }
    };
}

/**
 * 扩展停用时的清理函数
 * 在 VS Code 停用扩展时调用此方法
 */
export function deactivate() { }