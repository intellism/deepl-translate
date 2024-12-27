import { ITranslateRegistry } from 'comment-translate-manager';
import * as vscode from 'vscode';
import { AiTranslate } from './AiTranslate';

export function activate(context: vscode.ExtensionContext) {


    //公开插件
    return {
        extendTranslate: function (registry: ITranslateRegistry) {
            registry('ai-comment-translate', AiTranslate);
        }
    };
}

// 当您的扩展被停用时，将调用此方法
export function deactivate() { }
