import { Task } from "./Task";
import { StructureTaskRequest } from "./StructureTaskRequest";
export abstract class StructureTask extends Task {
  public request: StructureTaskRequest;
  structureID: string;
  room: Room;

  constructor(request: StructureTaskRequest) {
    super(request);

    this.request = request;
    this.structureID = this.request.assignedToID;
    this.room = Game.rooms[this.request.originatingRoomName];
  }

  protected init(): void {
    const building = Game.getObjectById(this.request.assignedToID) as AnyOwnedStructure;
    if (building == undefined) {
      this.request.status = "FINISHED";
      return;
    }
    //this.building = building;
  }
  protected prepare(): void {
    const building = Game.getObjectById(this.request.assignedToID) as AnyOwnedStructure;
    if (building == undefined || building == null) {
      console.log("building was null in prepare")
      this.request.status = "FINISHED";
    }
    //this.building = building;
  }

  protected work(): void {
    const building = Game.getObjectById(this.request.assignedToID) as AnyOwnedStructure;
    if (building == undefined || building == null) {
      console.log("building was null in continue")
      this.request.status = "FINISHED";
    }
    //this.building = building;
  }
  protected windDown(): void {

  }
  protected finish(): void {

    this.request.status = "FINISHED";

  }
}
