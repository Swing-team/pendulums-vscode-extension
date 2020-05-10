import { Project } from './project.model';
import { Activity } from './activity.model';

export class User {
  public id: string;
  public name?: string;
  public email: string;
  public projects?: Project[];
  public currentActivity?: Activity;

  constructor(id: string, email: string, name?: string, projects?: Project[], currentActivity?: Activity) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.projects = projects;
    this.currentActivity = currentActivity;
  }
}