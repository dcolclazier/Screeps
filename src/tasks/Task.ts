export abstract class Task implements ITask2 {

  request: ITaskRequest;

  protected abstract init(): void;
  protected abstract prepare(): void;
  protected abstract work(): void;
  protected abstract windDown(): void;
  protected abstract finish(): void;

  public run(): void {

    var oldStatus = this.request.status;
    switch (this.request.status) {
      case "INIT": this.init(); break;
      case "PREPARE": this.prepare(); break;
      case "IN_PROGRESS": this.work(); break;
      case "WIND_DOWN": this.windDown(); break;
      case "FINISHED": this.finish(); break;

    }
    if (this.request != null && oldStatus != this.request.status && this.request.status == "FINISHED") {
      this.run()
    }
  }

  constructor(taskInfo: ITaskRequest) {
    this.request = taskInfo;
  }
}
