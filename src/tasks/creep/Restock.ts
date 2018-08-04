import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "../CreepTaskQueue";
import * as utils from "utils/utils"
import { SmartLink } from "utils/memory";
import { Task } from "../Task";

export class RestockRequest extends CreepTaskRequest {
  priority: number = 0;
  name = "Restock";
  requiredRole : CreepRole[]= ["ROLE_CARRIER","ROLE_REMOTE_UPGRADER"];
  maxConcurrent = 2;
  constructor(roomName: string, restockID: string) {
    super(roomName, `🛒`, restockID);
  }
}


export class Restock extends CreepTask {

  sources: Source[] = []
  protected init(): void {
    super.init();

    var restock = this.request as RestockRequest;

    //console.log("status after init" + Task.getStatus(this.request.status))
    this.request.status = "PREPARE";
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == "FINISHED") return;
    const restockInfo = this.request as RestockRequest;
    var room = Game.rooms[this.request.roomName];
    var roomMem = room.memory as RoomMemory;
    var masterLink = _.find(roomMem.links, l => l.linkMode == "MASTER_RECEIVE");

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
      if (masterLink == undefined) {
        //console.log("collecting...")
        //if (this.collectFromStorage(room.name)) return;
        if (this.collectFromDroppedEnergy(room.name)) return;
        //console.log("no dropped energy...")
        if (this.collectFromTombstone(room.name)) return;
        else if (this.collectFromContainer(room.name)) return;
        else if (this.collectFromMasterLink(room.name)) return;
        else if (this.collectFromStorage(room.name)) return;
        else if (this.collectFromSource(room.name)) return;
        //this.collectFromDroppedEnergy(room.name);
        //this.collectFromTombstone(room.name);
        //this.collectFromSource(room.name);
      }
      else {
        if (this.collectFromDroppedEnergy(room.name)) return;
        //console.log("no dropped energy...")
        if (this.collectFromMasterLink(room.name)) return;
        if (this.collectFromTombstone(room.name)) return;
        
        if (this.collectFromContainer(room.name)) return;
        
        if (this.collectFromStorage(room.name)) return;
        if (this.collectFromSource(room.name)) return;
      }

    }
    else {
      this.request.status = "IN_PROGRESS";
    }
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == "FINISHED") return;
    const creep = Game.creeps[this.request.assignedTo];

    if (creep.room.name != this.request.roomName) {
      this.creep.moveTo(new RoomPosition(25, 25, this.request.roomName));
      return;
    }
    const room = Game.rooms[this.request.roomName];
    const roomMem = room.memory as RoomMemory;
    //var /*storage*/ = _.find(room.find(FIND_STRUCTURES), s => s.structureType == "storage") as StructureStorage;
    //if (storage == undefined) return;

    let targets = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
          structure.energy < structure.energyCapacity;
      }
    }).sort((structureA, structureB) => creep.pos.getRangeTo(structureA) - creep.pos.getRangeTo(structureB));
    //console.log("restock targets: " + targets.length);
    if (targets.length == 0) {

      this.request.status = "FINISHED";
      return;
    }
    else {
      const result = creep.transfer(targets[0], RESOURCE_ENERGY)
      const target = targets[0]
      if (result == ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      if (this.creep.carry.energy == 0) this.request.status = "FINISHED";
    }
  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

  static addRequests(roomName: string, energyLevel: number) {
    let restockables = utils.getRestockables(roomName);
  
    for (const targetID in restockables) {
      let restockable = restockables[targetID];
      let request = new RestockRequest(roomName, restockable.id);
      //if (energyLevel > 2) {
      //  request.requiredRole = ["ROLE_CARRIER","ROLE_REMOTE_UPGRADER"]
      //}
      let existingTaskCount = CreepTaskQueue.totalCount(roomName, request.name);
      let maxConcurrentCount = request.maxConcurrent;

      if (existingTaskCount < maxConcurrentCount) {
        CreepTaskQueue.addPendingRequest(request)
      }
    }
  }
}
