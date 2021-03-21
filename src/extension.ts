import * as vscode from 'vscode';
import * as io from 'socket.io-client';
import axios from 'axios';
import { StateService } from './services/stateService';
import { NotificationService } from './services/notificationService';
import { ProjectDataTreeProvider } from './views/project/projectsTreeDataProvider';
import { Project } from './models/project.model';
import { User } from './models/user.model';
import { SignInDataTreeProvider } from './views/signIn/signInTreeDataProvider';
import { DATABASE_COLUMNS } from './constants/strings';

const apiEndPoint = 'http://localhost:1337';
const socketEndPoint = 'http://localhost:1337';

let socket: any = null;
let state: StateService;
let notificationService: NotificationService;
let projectDataTreeProvider: ProjectDataTreeProvider;
let signInTreeProvider: SignInDataTreeProvider;

function initSocket() {
  socket = io(socketEndPoint, { path: '/socket.io', transports: ['websocket'], upgrade: true });
  socket.on('connect', () => {
    const sId = state.get(DATABASE_COLUMNS.sailsSessionId);
    console.log('websocket connected!');
    if (sId) {
      socket.emit('get', {
        method: 'get',
        url: '/socket/subscribe-to-events',
        headers: {
          cookie: 'sails.sid=' + sId
        }
      }, () => {
        // listen to events
      });
    }
  });

  socket.on('message', (data: any) => {
    console.log('hello');
    // if (data.type === 'projectRemoved') {
    //   //TODO: There might be a current activity running on this project
    //   console.log('delete project', data.data);
    //   console.log('delete project', data.data.toStrin());
    //   // let activeUserId = state.get(DATABASE_COLUMNS.activeUserId);
    //   // let userData = <User>state.get(String(activeUserId));
    //   // let deletedProjectIndex = userData.projects?.findIndex(project => project.id === data.data.toString());
    //   // userData.projects?.splice(Number(deletedProjectIndex), 1);

    // }

    // if (data.type === 'syncNeeded') {
    //   summary();
    // }
  });

  socket.on('disconnect', (error: any) => {
    console.log('websocket disconnected!', error);
  });
}

function init(context: vscode.ExtensionContext) {
  state = new StateService(context);
  notificationService = new NotificationService();

  // Add a request interceptor
  axios.interceptors.request.use(function (config) {
    config.headers.cookie = 'sails.sid=' + state.get(DATABASE_COLUMNS.sailsSessionId);
    return config;
  }, function (error) {
    // Do something with request error
    return Promise.reject(error);
  });

  // Add a response interceptor
  axios.interceptors.response.use(function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  }, function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    if (error.response && error.response.status === 403) {
      state.set(DATABASE_COLUMNS.sailsSessionId, undefined);
      state.set(DATABASE_COLUMNS.activeUserId, undefined);
      signInTreeProvider = new SignInDataTreeProvider();
      vscode.window.registerTreeDataProvider('pendulums-pendulums', signInTreeProvider);
    }
    return Promise.reject(error);
  });

  let activeUserId = state.get(DATABASE_COLUMNS.activeUserId);
  let sId = state.get(DATABASE_COLUMNS.sailsSessionId);
  if (sId && activeUserId) {
    let projects: Project[];
    projects = <Project[]>(<User>state.get(String(activeUserId))).projects;
    projectDataTreeProvider = new ProjectDataTreeProvider(projects);
    vscode.window.registerTreeDataProvider('pendulums-pendulums', projectDataTreeProvider);

    summary();
  } else {
    state.set(DATABASE_COLUMNS.sailsSessionId, undefined);
    signInTreeProvider = new SignInDataTreeProvider();
    vscode.window.registerTreeDataProvider('pendulums-pendulums', signInTreeProvider);
  }
}

function summary() {
  //TODO: Sync first
  axios.get(apiEndPoint + '/user/summary')
    .then(response => {
      let user: User = response.data.user;
      state.set(DATABASE_COLUMNS.activeUserId, user.id);
      state.set(user.id, user);
      projectDataTreeProvider = new ProjectDataTreeProvider(user.projects, user.currentActivity);
      vscode.window.registerTreeDataProvider('pendulums-pendulums', projectDataTreeProvider);
    })
    .catch(error => {
      console.log('error', error);
      notificationService.showError(`Summary failed ${error}`);
    });
}

function signOut() {
  axios.get(apiEndPoint + '/auth/signOut')
    .then(response => {
      state.set(DATABASE_COLUMNS.sailsSessionId, undefined);
      state.set(DATABASE_COLUMNS.activeUserId, undefined);
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
  axios.post(apiEndPoint + '/auth/signin', {
    email: email,
    password: password
  })
    .then(response => {
      notificationService.showInformation('Signed in successfully');
      console.log(response.headers);
      let sailsSessionId = response.headers['set-cookie'][0].split('sails.sid=')[1];
      state.set(DATABASE_COLUMNS.sailsSessionId, sailsSessionId);
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

  vscode.commands.registerCommand('pendulums.play', async (args) => {
    console.log('play args', args);
    let activeUserId = state.get(DATABASE_COLUMNS.activeUserId);
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
  initSocket();
  initCommands(context);
}

// this method is called when your extension is deactivated
export function deactivate() { }
