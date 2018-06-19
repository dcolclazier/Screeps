import { ITask } from "contract/ITask";
import { ITaskRequest } from "contract/ITaskRequest";

export enum TaskStatus {
  PENDING = 0,
  INIT,
  PREPARE,
  PRE_RUN,
  IN_PROGRESS,
  POST_RUN,
  FINISHED,
}
export abstract class Task implements ITask {

  request: ITaskRequest;
  constructor(taskInfo: ITaskRequest) {
    this.request = taskInfo;
  }
  //protected abstract prerun(): void;
  protected abstract init(): void;
  protected abstract prepare(): void;
  protected abstract continue(): void;
  //protected abstract postrun(): void;
  protected abstract finish(): void;
  public run(): void {
    //console.log(`RUN: ${this.request.name} + ${this.request.assignedTo} + ${Task.getStatus(this.request.status)} `)

    if (Game.creeps[this.request.assignedTo] == undefined) console.log("creep was null during run - should handle.")

    var oldStatus = this.request.status;
    switch (this.request.status) {
      // case TaskState.PENDING: this.pending();
      case TaskStatus.INIT: this.init(); break;
      case TaskStatus.PREPARE: this.prepare(); break;
      //case TaskStatus.PRE_RUN: this.p(); break;
      case TaskStatus.IN_PROGRESS: this.continue(); break;
      case TaskStatus.FINISHED: this.finish(); break;
      // case TaskState.POST_RUN: this.preRun();
    }
    if (this.request != null && oldStatus != this.request.status) this.run()
  }
  static getStatus(state: TaskStatus) {
    if (state == TaskStatus.PENDING) return "PENDING";
    if (state == TaskStatus.INIT) return "INIT";
    if (state == TaskStatus.PREPARE) return "PREPARE";
    if (state == TaskStatus.PRE_RUN) return "PRE_RUN";
    if (state == TaskStatus.IN_PROGRESS) return "IN_PROGRESS";
    if (state == TaskStatus.POST_RUN) return "POST_RUN";
    if (state == TaskStatus.FINISHED) return "FINISHED";
    return `${state} is unknown...`
  }
}
