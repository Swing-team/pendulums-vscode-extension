import * as vscode from 'vscode';

export class NotificationService {
    constructor() { }

    showInformation(message: string) {
        vscode.window.showInformationMessage(message);
    }

    showWarning(message: string) {
        vscode.window.showWarningMessage(message);
    }

    showError(message: string) {
        vscode.window.showErrorMessage(message);
    }
}