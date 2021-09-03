import * as vscode from "vscode";
import axios from "axios";
import { SignInDataTreeProvider } from "../../views/signIn/signIn-tree-data-provider";
import { SecretStorageService } from "../storage/secret-storage.service";
import { StateService } from "../storage/state.service";
import { StorageKey } from "../storage/storage-key";
import { User } from "../../models/user.model";
import { ProjectDataTreeProvider } from "../../views/project/projects-tree-data-provider";
import { NotificationService } from "../notification.service";

export class ApiService {
  private readonly instance;
  private readonly secretStorageService;
  private readonly stateService;
  private readonly notificationService;

  constructor(
    secretStorageService: SecretStorageService,
    stateService: StateService,
    notificationService: NotificationService
  ) {
    this.secretStorageService = secretStorageService;
    this.stateService = stateService;
    this.notificationService = notificationService;
    this.instance = axios.create({
      baseURL: 'https://app.pendulums.io/api',
    });

    // Add a request interceptor
    this.instance.interceptors.request.use(
      async (config) => {
        const sId = await this.secretStorageService.get(
          StorageKey.sailsSessionId
        );
        if (sId) {
          config.headers.cookie = "sails.sid=" + sId;
        }
        return config;
      },
      function (error) {
        // Do something with request error
        return Promise.reject(error);
      }
    );

    // Add a response interceptor
    this.instance.interceptors.response.use(
      function (response) {
        // Any status code that lie within the range of 2xx cause this function to trigger
        return response;
      },
      async (error) => {
        // Any status codes that falls outside the range of 2xx cause this function to trigger
        if (error.response && error.response.status === 403) {
          this.secretStorageService.delete(StorageKey.sailsSessionId);
          this.stateService.set(StorageKey.activeUserId, undefined);
          const signInTreeProvider = new SignInDataTreeProvider();
          vscode.window.registerTreeDataProvider(
            "pendulums-pendulums",
            signInTreeProvider
          );
        }
        return Promise.reject(error);
      }
    );
  }

  summary() {
    this.instance
      .get("/user/summary")
      .then(async (response) => {
        let user: User = response.data.user;
        await this.stateService.set(StorageKey.activeUserId, user.id);
        await this.stateService.set(user.id, user);
        const projectDataTreeProvider = new ProjectDataTreeProvider(
          user.projects,
          user.currentActivity
        );
        vscode.window.registerTreeDataProvider(
          "pendulums-pendulums",
          projectDataTreeProvider
        );
      })
      .catch((error) => {
        console.log("error", error);
        this.notificationService.showError(`Summary failed ${error}`);
      });
  }

  signOut() {
    this.instance
      .get("/auth/signOut")
      .then(async (response) => {
        await this.secretStorageService.delete(StorageKey.sailsSessionId);
        await this.stateService.set(StorageKey.activeUserId, undefined);
        this.notificationService.showInformation("Signed out successfully");

        vscode.window.registerTreeDataProvider(
          "pendulums-pendulums",
          new SignInDataTreeProvider()
        );
      })
      .catch((error) => {
        console.log("error", error);
        this.notificationService.showError(`Sign out failed ${error}`);
      });
  }

  signIn(email: string, password: string) {
    this.instance.post('/auth/signin', {
      email: email,
      password: password
    })
      .then(async response => {
        this.notificationService.showInformation('Signed in successfully');
        console.log(response.headers);
        let sailsSessionId = response.headers['set-cookie'][0].split('sails.sid=')[1];
        await this.secretStorageService.set(StorageKey.sailsSessionId, sailsSessionId);
        this.summary();
      })
      .catch(error => {
        console.log('error', error);
        this.notificationService.showError(`Sign in failed ${error}`);
      });
  }
}
