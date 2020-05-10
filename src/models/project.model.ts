export class Project {
    public id: string;
    public name: string;
    public recentActivityName?: string;

    constructor(id: string, name: string, reventActivityName?: string) {
        this.id = id;
        this.name = name;
        this.recentActivityName = this.recentActivityName;
    }
}