export abstract class Task implements ITask2 {

  //public abstract addRequests(roomName: string, energyLevel: number): void;
  request: ITaskRequest;
  constructor(taskInfo: ITaskRequest) {
    this.request = taskInfo;
  }
  protected abstract init(): void;
  protected abstract prepare(): void;
  protected abstract work(): void;
  protected abstract windDown(): void;
  protected abstract finish(): void;
  //abstract name: string;
  public run(): void {

    var oldStatus = this.request.status;
    switch (this.request.status) {
      case "INIT": this.init(); break;
      case "PREPARE": this.prepare(); break;
      case "IN_PROGRESS": this.work(); break;
      case "WIND_DOWN": this.windDown(); break;
      case "FINISHED": this.finish(); break;

    }
    if (this.request != null && oldStatus != this.request.status) this.run()
  }
 
}


//export abstract class Task implements ITask {

//  request: ITaskRequest;
//  constructor(taskInfo: ITaskRequest) {
//    this.request = taskInfo;
    
//  }
//  //protected abstract prerun(): void;
//  protected abstract init(): void;
//  protected abstract prepare(): void;
//  protected abstract work(): void;
//  //protected abstract postrun(): void;
//  protected abstract finish(): void;
//  public run(): void {
//    //console.log(`RUN: ${this.request.name} + ${this.request.assignedTo} + ${Task.getStatus(this.request.status)} `)

//    //if (Game.creeps[this.request.assignedTo] == undefined) console.log("creep was null during run - should handle.")

//    var oldStatus = this.request.status;
//    switch (this.request.status) {
//      // case TaskState.PENDING: this.pending();
//      case "INIT": this.init(); break;
//      case "PREPARE": this.prepare(); break;
//      //case "PRE_RUN": this.p(); break;
//      case "IN_PROGRESS": this.work(); break;
//      case "FINISHED": this.finish(); break;
//      // case TaskState.POST_RUN: this.preRun();
//    }
//    if (this.request != null && oldStatus != this.request.status) this.run()
//  }
//  static getStatus(state: TaskStatus) {
//    if (state == "PENDING") return "PENDING";
//    if (state == "INIT") return "INIT";
//    if (state == "PREPARE") return "PREPARE";
//    if (state == "PRE_RUN") return "PRE_RUN";
//    if (state == "IN_PROGRESS") return "IN_PROGRESS";
//    if (state == "WIND_DOWN") return "POST_RUN";
//    if (state == "FINISHED") return "FINISHED";
//    return `${state} is unknown...`
//  }
//}
