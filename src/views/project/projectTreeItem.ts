import * as vscode from 'vscode';
import { Project } from '../../models/project.model';

export class ProjectTreeItem extends vscode.TreeItem {
  public project: Project;
  constructor(project: Project) {
    super(project.name, vscode.TreeItemCollapsibleState.None);
    this.project = project;
  }

  setContextValue(contextValue: string) {
    this.contextValue = contextValue;
  }
}
