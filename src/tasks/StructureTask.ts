import { Task } from "./Task";
//import { StructureTaskRequest } from "./StructureTaskRequest";
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
    if (building == undefined || building == null) {
      console.log("building was null in prepare")
      this.request.status = "FINISHED";
    }
    this.building = building;
  }

  protected continue(): void {
    const building = Game.getObjectById(this.request.assignedTo) as AnyOwnedStructure;
    if (building == undefined || building == null) {
      console.log("building was null in continue")
      this.request.status = "FINISHED";
    }
    this.building = building;
  }
  protected finish(): void {
   // console.log(`StructureTask Finish: ${this.request.roomName}: ${this.request.name}: ${this.request.assignedTo}`);
    const building = Game.getObjectById(this.request.assignedTo) as AnyOwnedStructure;
    if (building == undefined) {
      console.log("building was undefined.")
    }
    var room = building.room as Room;
    var mem = room.memory as RoomMemory;
    var towers = mem.towers;
    var mine = towers[this.request.assignedTo] as SmartStructure;
    if(mine == undefined) console.log("not yet...")
   // console.log("Structure Task assigned to "  + this.request.assignedTo)
    if (mine != undefined) {
      var towerMem = mine.memory as StructureMemory;
      towerMem.idle = true;
      towerMem.currentTask = "";
      
    }
    //else throw Error("What?")
    
  }
}
