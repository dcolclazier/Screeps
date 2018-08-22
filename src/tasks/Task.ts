export abstract class Task implements ITask2 {

    request: ITaskRequest;

    protected abstract init(): void;
    protected abstract prepare(): void;
    protected abstract work(): void;
    protected abstract windDown(): void;
    protected abstract finish(): void;

    public run(): void {
        var start = Game.cpu.getUsed();
        var count = 0;
        var oldStatus = this.request.status;
        switch (this.request.status) {
            case "INIT": this.init(); count++; break;
            case "PREPARE": this.prepare(); count++; break;
            case "IN_PROGRESS": this.work(); count++; break;
            case "WIND_DOWN": this.windDown(); count++; break;
            case "FINISHED": this.finish(); count++; break;

        }
        if (this.request != null && oldStatus != this.request.status) this.run()
        else if (Game.time % 5 == 0) {
            //console.log(`${Game.cpu.getUsed() - start} -->${this.request.name}, count: ${count}`);
        }
    }

    constructor(taskInfo: ITaskRequest) {
        this.request = taskInfo;
    }
}
