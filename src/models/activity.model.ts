export class Activity {
  public id: string;
  public name: string;
  /**
   * This is the projectId this activity is related to.
   */
  public project: string;
  /**
   * This is the userId this activity is related to.
   */
  public user: string;
  public createdAt: string;
  public updatedAt: string;
  public startedAt: string;
  public stoppedAt: string;

  constructor(id: string, name: string, project: string, user: string, createdAt: string, updatedAt: string, startedAt: string, stoppedAt: string) {
    this.id = id;
    this.name = name;
    this.project = project;
    this.user = user;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.startedAt = startedAt;
    this.stoppedAt = stoppedAt;
  }
}