import * as vscode from 'vscode';

export class StateService {
    private globalState: vscode.Memento;
    constructor(contenxt: vscode.ExtensionContext) {
        this.globalState = contenxt.globalState;
    }

    get(key: string): object | undefined {
        if (!this.globalState) {
            throw new Error('The globalState not initialized');
        }
        return this.globalState.get(key);
    }

    set(key: string, value: object | undefined): Thenable<void> {
        if (!this.globalState) {
            throw new Error('The globalState not initialized');
        }
        return this.globalState.update(key, value);
    }
}