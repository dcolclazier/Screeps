import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "../CreepTaskQueue";
import * as utils from "utils/utils"
import { Task } from "../Task";
import { roomManager } from "RoomManager";

export class RestockRequest extends CreepTaskRequest {
  priority: number = 0;
  name = "Restock";
  validRoles: CreepRole[] = ["ROLE_CARRIER", "ROLE_REMOTE_UPGRADER"];
  maxConcurrent = 2;
  constructor(roomName: string, restockID: string) {
    super(roomName, roomName, restockID, `🛒`);
  }
}


export class Restock extends CreepTask {


  currentRestockID: string | undefined = undefined
  static taskName: string = "Restock";
  sources: Source[] = [];
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }
  protected init(): void {
    super.init();

    var restock = this.request as RestockRequest;

    //console.log("status after init" + Task.getStatus(this.request.status))
    this.request.status = "PREPARE";
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status != "PREPARE") return;

    var room = Game.rooms[this.request.targetRoomName];

    const links = roomManager.getLinks2(this.request.targetRoomName);
    var masterLink = _.find(links, l => l.linkMode == "MASTER_RECEIVE");

    //this.collectFromContainer(this.request.roomName, creep.id);
    let targets = this.creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
          structure.energy < structure.energyCapacity;
      }
    }).sort((structureA, structureB) => this.creep.pos.getRangeTo(structureA) - this.creep.pos.getRangeTo(structureB));
    //console.log("restock targets: " + targets.length);
    if (targets.length == 0) {

      this.request.status = "FINISHED";
      return;
    }

    //temp code...
    if (this.creep.carry.energy < this.creep.carryCapacity) {
      if (this.collectFromMasterLink(room.name)) return;
      if (this.collectFromStorage(room.name)) return;

      if (this.collectFromContainer(room.name)) return;
      if (this.collectFromDroppedEnergy(room.name)) return;
      if (this.collectFromTombstone(room.name)) return;
      if (this.collectFromSource(room.name)) return;
      
    }
    else {
      this.request.status = "IN_PROGRESS";
    }
  }

  private getNextRestockID(): string|undefined {
    let targets = this.creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
          structure.energy < structure.energyCapacity;
      }
    }).sort((structureA, structureB) => this.creep.pos.getRangeTo(structureA) - this.creep.pos.getRangeTo(structureB));
    return targets.length == 0 ? undefined : targets[0].id;
  }

  protected work(): void {
    super.work();
    if (this.request.status != "IN_PROGRESS") return;

    if (this.currentRestockID == undefined) {
      this.currentRestockID = this.getNextRestockID();
      if (this.currentRestockID == undefined) {
        this.request.status = "FINISHED";
        return;
      }
    }

    const restockTarget = <StructureExtension | StructureSpawn>Game.getObjectById(this.currentRestockID);
    if (restockTarget.energy == restockTarget.energyCapacity) {
      this.currentRestockID == this.getNextRestockID();
      if (this.currentRestockID == undefined) {
        this.request.status = "FINISHED";
        return;
      }
    }
    else {
      const result = this.creep.transfer(restockTarget, RESOURCE_ENERGY)
      if (result == ERR_NOT_IN_RANGE) {
        this.creep.travelTo(restockTarget);
      }
      if (this.creep.carry.energy == 0) this.request.status = "FINISHED";
    }

  }


  static addRequests(roomName: string) {
    let restockables = roomManager.findRestockables(roomName);

    for (const targetID in restockables) {
      let restockable = restockables[targetID];
      let request = new RestockRequest(roomName, restockable.id);
     
      let existingTaskCount = CreepTaskQueue.count(roomName, request.name);
      let maxConcurrentCount = request.maxConcurrent;

      if (existingTaskCount < maxConcurrentCount) {
        CreepTaskQueue.addPendingRequest(request)
      }
    }
  }
}
