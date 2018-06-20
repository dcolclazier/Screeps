import { Task, TaskStatus } from "./Task";
import { ITaskRequest } from "contract/ITaskRequest";
import { StructureTaskRequest } from "./StructureTaskRequest";
export abstract class StructureTask extends Task {
  public request: StructureTaskRequest;
  building: AnyOwnedStructure;

  constructor(taskInfo: ITaskRequest) {
    super(taskInfo);
    this.request = taskInfo as StructureTaskRequest;
    const building = Game.getObjectById(this.request.assignedTo) as AnyOwnedStructure;
    if (building == undefined) throw "Building cannot be undefined."
    this.building = building;
  }
  protected init(): void {
    const building = Game.getObjectById(this.request.assignedTo) as AnyOwnedStructure;
    if (building == undefined) throw "Building cannot be undefined."
    this.building = building;
  }
  protected prepare(): void {
    const building = Game.getObjectById(this.request.assignedTo) as AnyOwnedStructure;
    if (building == undefined || building == null) this.request.status = TaskStatus.FINISHED;
    this.building = building;
  }

  protected continue(): void {
    const building = Game.getObjectById(this.request.assignedTo) as AnyOwnedStructure;
    if (building == undefined) this.request.status = TaskStatus.FINISHED;
    this.building = building;
  }
  protected finish(): void {
    //console.log(`StructureTask Finish: ${this.request.name}: ${this.request.assignedTo}`);
    //const building = Game.getObjectById(this.request.assignedTo) as AnyOwnedStructure;
    //if (building == undefined) {
    //  console.log("building was undefined.")
    //}
  }
}
