import * as vscode from 'vscode';
import { ProjectTreeItem } from './projectTreeItem';
import { Project } from '../../models/project.model';
import { Activity } from '../../models/activity.model';

export class ProjectDataTreeProvider implements vscode.TreeDataProvider<ProjectTreeItem | vscode.TreeItem> {
  private projects: Project[];
  private currentActivity?: Activity;
  private onDidChange: vscode.EventEmitter<ProjectTreeItem>;
  private projectItemTree: ProjectTreeItem[] = [];
  private emptyItemTree: vscode.TreeItem[] = [];
  onDidChangeTreeData?: vscode.Event<ProjectTreeItem | null | undefined> | undefined;
  constructor(projects?: Project[], currentActivity?: Activity) {
    this.projects = projects ? projects : <Project[]>[];
    this.currentActivity = currentActivity;
    this.onDidChange = new vscode.EventEmitter<ProjectTreeItem>();
    this.onDidChangeTreeData = this.onDidChange.event;
  }

  public changePlayingProp(projectId: string, playing: boolean) {
    const index = this.projectItemTree.findIndex(p => p.project.id === projectId);
    let projectItem = this.projectItemTree[index];
    projectItem.setContextValue(`${playing}`);
    this.onDidChange.fire(projectItem);
  }

  getTreeItem(element: ProjectTreeItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }
  getChildren(element?: ProjectTreeItem | vscode.TreeItem | undefined): vscode.ProviderResult<ProjectTreeItem[] | vscode.TreeItem[]> {
    //TODO: Get the projects from state directly
    if (!element) {
      this.projectItemTree = [];
      this.emptyItemTree = [];
      let itemTree: ProjectTreeItem;
      if (this.projects.length === 0) {
        let emptyProject = new vscode.TreeItem('There is no project', vscode.TreeItemCollapsibleState.None);
        this.emptyItemTree.push(emptyProject);
        return Promise.resolve(this.emptyItemTree);
      } else {
        this.projects.forEach(project => {
          itemTree = new ProjectTreeItem(project);
          if (this.currentActivity && this.currentActivity.project === project.id) {
            itemTree.setContextValue('true');
          } else {
            itemTree.setContextValue('false');
          }
          this.projectItemTree.push(itemTree);
        });
        return Promise.resolve(this.projectItemTree);
      }
    }
  }
}