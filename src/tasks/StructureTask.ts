import { Task } from "./Task";
import { StructureTaskRequest } from "./StructureTaskRequest";
import { roomManager } from "RoomManager";
//import { StructureTaskRequest } from "./StructureTaskRequest";
export abstract class StructureTask extends Task {
  public request: StructureTaskRequest;
  structureID: string;
  room: Room;

  constructor(request: StructureTaskRequest) {
    super(request);

    this.request = request;
    //const building = Game.getObjectById(this.request.assignedToID) as AnyOwnedStructure;
    //this.building = building;
    this.structureID = this.request.assignedToID;
    this.room = Game.rooms[this.request.originatingRoomName];
    //console.log("ID: " + this.request.assignedToID);
    //console.log("constructor for task...")
    //if (building == undefined) {
    //  this.request.status = "FINISHED";
    //  return;
    //}
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
  protected finish(): void {
    // console.log(`StructureTask Finish: ${this.request.roomName}: ${this.request.name}: ${this.request.assignedTo}`);
    this.request.status = "FINISHED";
    //const building = Game.getObjectById(this.request.assignedToID) as AnyOwnedStructure;
    //if (building == undefined) {
    //  console.log("building was undefined.")
    //}
    ////var room = building.room as Room;
    ////var mem = room.memory as RoomMemory;
    ////var towers = mem.towers2;
    //var tower = <StructureTower>Game.getObjectById(this.request.assignedToID);
    //if (tower == undefined) {
     
    //  return;
    //}

  }
}
