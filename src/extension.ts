import * as vscode from 'vscode'; // 导入 VS Code 扩展开发 API
import { AiTranslate } from './AiTranslate'; // 导入 AI 翻译类
import { log } from 'console';

/**
 * 扩展激活入口
 * 在 VS Code 加载扩展时调用此方法
 * @param context 扩展上下文，用于注册命令和管理资源
 */
export function activate(context: vscode.ExtensionContext) {
    // 创建 AI 翻译实例
    const aiTranslate = new AiTranslate();

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