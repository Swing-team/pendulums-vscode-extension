import * as vscode from 'vscode';

export class SignInDataTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

  onDidChangeTreeData?: vscode.Event<vscode.TreeItem | null | undefined> | undefined;
  getTreeItem(element: vscode.TreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  getChildren(element?: vscode.TreeItem | undefined): vscode.ProviderResult<vscode.TreeItem[]> {
    if (!element) {
      let signIn = new vscode.TreeItem('Sign in', vscode.TreeItemCollapsibleState.None);
      signIn.command = {
        title: 'Sign in',
        command: 'pendulums.signIn'
      };
      signIn.contextValue = '111';
      let items = [];
      items.push(signIn);
      return Promise.resolve(items);
    }
  }


}