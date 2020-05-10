import * as vscode from 'vscode';
import { StateService } from './services/stateService';
import { NotificationService } from './services/notificationService';
import { ProjectDataTreeProvider } from './views/project/projectsTreeDataProvider';
import axios from 'axios';
import { Project } from './models/project.model';
import { SignInDataTreeProvider } from './views/signIn/signInTreeDataProvider';

let state: StateService;
let notificationService: NotificationService;
let projectDataTreeProvider: ProjectDataTreeProvider;

function init(context: vscode.ExtensionContext) {
  state = new StateService(context);
  notificationService = new NotificationService();

  let projects: Project[];
  projects = <Project[]>state.get('projects');
  if (projects) {
    console.log('test', projects);
    projectDataTreeProvider = new ProjectDataTreeProvider(projects);
    vscode.window.registerTreeDataProvider('pendulums-pendulums', projectDataTreeProvider);
  }

  summary();
}

function summary() {
  const sessionIdCookie = state.get('sails.sid');
  axios.get('https://app.pendulums.io/api/user/summary',
    {
      headers: {
        cookie: 'sails.sid=' + sessionIdCookie
      }
    })
    .then(response => {
      console.log('response', response);
      let projects: Project[] = response.data.user.projects;
      console.log('projects', projects);
      state.set('projects', projects);
      projectDataTreeProvider = new ProjectDataTreeProvider(projects);
      vscode.window.registerTreeDataProvider('pendulums-pendulums', projectDataTreeProvider);
    })
    .catch(error => {
      console.log('error', error);
      notificationService.showError('Error on getting summary' + error);
    });

  // var options = {
  // 	hostname: 'app.pendulums.io',
  // 	path: '/api/user/summary',
  // 	method: 'GET',
  // 	headers: {
  // 		 'Content-Type': 'application/json',
  // 	   }
  //   };

  //   var req = https.request(options, (res) => {
  // 	console.log('statusCode:', res.statusCode);
  // 	console.log('headers:', res.headers);

  // 	res.on('data', (d) => {
  // 	  console.log('data', d);
  // 	});
  //   });

  //   req.on('error', (e) => {
  // 	console.error(e);
  //   });

  //   req.end();
}

function signOut() {
  const sessionIdCookie = state.get('sails.sid');
  axios.get('https://app.pendulums.io/api/auth/signOut',
    {
      headers: {
        cookie: 'sails.sid=' + sessionIdCookie
      }
    })
    .then(response => {
      console.log('response', response);
      state.set('sails.sid', undefined);
      notificationService.showInformation('Signed out successfully');

      vscode.window.registerTreeDataProvider('pendulums-pendulums', new SignInDataTreeProvider());
    })
    .catch(error => {
      console.log('error', error);
      notificationService.showError(`Sign out failed ${error}`);
    });
}

async function signIn() {
  const email = await vscode.window.showInputBox({
    placeHolder: 'Email',
    prompt: 'test'
  });
  if (!email) {
    notificationService.showError('Email can\'t be empty');
    return;
  }
  const password = await vscode.window.showInputBox({
    placeHolder: 'Password',
    password: true
  });
  if (!password) {
    notificationService.showError('Password can\'t be empty');
    return;
  }
  axios.post('https://app.pendulums.io/api/auth/signin', {
    email: email,
    password: password
  })
    .then(response => {
      notificationService.showInformation('Signed in successfully');
      let sailsSessionId = response.headers['set-cookie'][0].split('sails.sid=')[1];
      state.set('sails.sid', sailsSessionId);
      summary();
    })
    .catch(error => {
      console.log('error', error);
      notificationService.showError(`Sign in failed ${error}`);
    });
}

function initCommands(context: vscode.ExtensionContext) {
  let syncCommand = vscode.commands.registerCommand('pendulums.sync', () => {
    summary();
  });

  let signInCommand = vscode.commands.registerCommand('pendulums.signIn', () => {
    signIn();
  });

  let signOutCommand = vscode.commands.registerCommand('pendulums.signOut', () => {
    signOut();
  });

  let getProjectsCommand = vscode.commands.registerCommand('pendulums.getProjects', () => {
    summary();
  });

  vscode.commands.registerCommand('pendulums.play', (args) => {
    console.log('play args', args);
    projectDataTreeProvider.changePlayingProp(args.project.id, true);


  });

  vscode.commands.registerCommand('pendulums.pause', (args) => {
    console.log('pause args', args);
    projectDataTreeProvider.changePlayingProp(args.project.id, false);
  });
}

export async function activate(context: vscode.ExtensionContext) {
  init(context);
  initCommands(context);
}

// this method is called when your extension is deactivated
export function deactivate() { }
