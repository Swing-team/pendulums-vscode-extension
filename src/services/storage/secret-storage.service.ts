import * as vscode from 'vscode';

export class SecretStorageService {
  private secretStorage: vscode.SecretStorage;
  constructor(contenxt: vscode.ExtensionContext) {
    this.secretStorage = contenxt.secrets;
  }

  async get(key: string): Promise<string | undefined> {
    if (!this.secretStorage) {
      throw new Error('The secretStorage is not initialized');
    }
    return await this.secretStorage.get(key);
  }

  set(key: string, value: string): Thenable<void> {
    if (!this.secretStorage) {
      throw new Error('The secretStorage is not initialized');
    }
    return this.secretStorage.store(key, value);
  }

  delete(key: string): Thenable<void> {
    if (!this.secretStorage) {
      throw new Error('The secretStorage is not initialized');
    }
    return this.secretStorage.delete(key);
  }
}