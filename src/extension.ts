import * as vscode from 'vscode';
import { StateService } from './services/storage/state.service';
import { NotificationService } from './services/notification.service';
import { ProjectDataTreeProvider } from './views/project/projects-tree-data-provider';
import { Project } from './models/project.model';
import { User } from './models/user.model';
import { SignInDataTreeProvider } from './views/signIn/signIn-tree-data-provider';
import { StorageKey } from './services/storage/storage-key';
import { SecretStorageService } from './services/storage/secret-storage.service';
import { ApiService } from './services/api/api.service';

let state: StateService;
let secretStorageService: SecretStorageService;
let notificationService: NotificationService;
let apiService: ApiService;
let projectDataTreeProvider: ProjectDataTreeProvider;
let signInTreeProvider: SignInDataTreeProvider;

async function init(context: vscode.ExtensionContext) {
  state = new StateService(context);
  secretStorageService = new SecretStorageService(context);
  notificationService = new NotificationService();
  apiService = new ApiService(secretStorageService, state, notificationService);

  const sId = await secretStorageService.get(StorageKey.sailsSessionId);
  const activeUserId = state.get(StorageKey.activeUserId);

  if (sId && activeUserId) {
    let projects: Project[];
    projects = <Project[]>(<User>state.get(String(activeUserId))).projects;
    projectDataTreeProvider = new ProjectDataTreeProvider(projects);
    vscode.window.registerTreeDataProvider('pendulums-pendulums', projectDataTreeProvider);

    apiService.summary();
  } else {
    await secretStorageService.delete(StorageKey.sailsSessionId);
    await state.set(StorageKey.activeUserId, undefined);
    signInTreeProvider = new SignInDataTreeProvider();
    vscode.window.registerTreeDataProvider('pendulums-pendulums', signInTreeProvider);
  }
}

async function signIn() {
  const email = await vscode.window.showInputBox({
    placeHolder: 'Email',
    prompt: 'Email'
  });
  if (!email) {
    notificationService.showError('Email can\'t be empty');
    return;
  }
  const password = await vscode.window.showInputBox({
    placeHolder: 'Password',
    prompt: 'Password',
    password: true
  });
  if (!password) {
    notificationService.showError('Password can\'t be empty');
    return;
  }
  apiService.signIn(email, password);
}

function initCommands(context: vscode.ExtensionContext) {
  let syncCommand = vscode.commands.registerCommand('pendulums.sync', () => {
    apiService.summary();
  });

  let signInCommand = vscode.commands.registerCommand('pendulums.signIn', () => {
    signIn();
  });

  let signOutCommand = vscode.commands.registerCommand('pendulums.signOut', () => {
    apiService.signOut();
  });

  let getProjectsCommand = vscode.commands.registerCommand('pendulums.getProjects', () => {
    apiService.summary();
  });

  vscode.commands.registerCommand('pendulums.play', async (args) => {
    console.log('play args', args);
    let activeUserId = await state.get(StorageKey.activeUserId);
    let userData = <User>state.get(String(activeUserId));
    if (userData.currentActivity && userData.currentActivity.id) {
      notificationService.showError('Please stop the running activity first');
    } else {
      const activityName = await vscode.window.showInputBox({
        placeHolder: 'Untitled Activity',
        prompt: 'Enter activity title'
      });
      projectDataTreeProvider.changePlayingProp(args.project.id, true);
    }
  });

  vscode.commands.registerCommand('pendulums.stop', (args) => {
    console.log('stop args', args);
    projectDataTreeProvider.changePlayingProp(args.project.id, false);
  });
}

export async function activate(context: vscode.ExtensionContext) {
  init(context);
  initCommands(context);
}

// this method is called when your extension is deactivated
export function deactivate() { }
