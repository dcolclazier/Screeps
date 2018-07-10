import { CreepTask } from "tasks/CreepTask"
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "../CreepTaskQueue";
import { CreepMemory } from "utils/memory";
//import { RoomManager } from "RoomManager";
import { CreepRole } from "utils/utils";
import { TaskStatus } from "tasks/Task";

export class UpgradeRequest extends CreepTaskRequest {

  requiredRole = [CreepRole.ROLE_UPGRADER]
  priority: number = 5;
  name = "Upgrade";
  maxConcurrent: number;
  constructor(roomName: string, controllerID: string, maxPerRoom: number) {
    super(roomName, `🎇`, controllerID);
    this.maxConcurrent = maxPerRoom
  }
}
export class DefendRequest extends CreepTaskRequest {

  requiredRole = [CreepRole.ROLE_DEFENDER]
  priority: number = 0;
  name = "DEFEND";
  maxConcurrent: number;
  constructor(roomName: string, controllerID: string, maxPerRoom: number) {
    super(roomName, `🎇`, controllerID);
    this.maxConcurrent = maxPerRoom
  }
}

export class Defend extends CreepTask {

  
  northDefendPositionW6S43_1: RoomPosition = new RoomPosition(33,4,"W6S43");
  northDefendPositionW6S43_2: RoomPosition = new RoomPosition(33,6,"W6S43");
  northDefendPositionW6S43_3: RoomPosition = new RoomPosition(33, 7, "W6S43");

  protected init(): void {
    super.init();
    this.request.status = TaskStatus.PREPARE;

  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == TaskStatus.FINISHED) return;

    var room = Game.rooms[this.request.roomName];
    var roomMem = room.memory as RoomMemory;
    this.request.status = TaskStatus.IN_PROGRESS;
    //if (room.energyAvailable < 1000) return;
    //if (this.creep.carry.energy == 0) {

    //  if (this.collectFromContainer(room.name)) return;
    //  if (room.energyCapacityAvailable > 1300) return;
    //  if (this.collectFromDroppedEnergy(room.name)) return;
    //  if (this.collectFromTombstone(room.name)) return;
    //  if (this.collectFromStorage(room.name)) return;
      
      
    //  //this.collectFromSource(room.name);

    //}
    //else this.request.status = TaskStatus.IN_PROGRESS;
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == TaskStatus.FINISHED) return;
    var room = Game.rooms[this.request.roomName];
    var roomMem = room.memory as RoomMemory;
    var enemies = room.find(FIND_HOSTILE_CREEPS).sort(e => e.hits);
    var closestRampartToEn
    if (enemies.length == 0) {
      this.request.status = TaskStatus.FINISHED;
      return;
    }
    var lowest = _.first(enemies);
    if (this.creep.attack(lowest) == ERR_NOT_IN_RANGE) {
      this.creep.moveTo(lowest);
    }
    
    //const creep = Game.creeps[this.request.assignedTo];
    //if (this.creep.carry.energy == 0) {
    //  this.request.status = TaskStatus.PREPARE;
    //  return;
    //}
    //const info = this.request as UpgradeRequest
    //let controller = Game.getObjectById(info.targetID) as StructureController;
    //if (this.creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
    //  this.creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
    //}
    
  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

  static addRequests(roomName: string, maxPerRoom: number): void {
    let controller = Game.rooms[roomName].controller as StructureController;
    let request = new DefendRequest(roomName, controller.id, maxPerRoom);
    let tasksNeeded = request.maxConcurrent - CreepTaskQueue.totalCount(roomName, request.name);
    for (let i = 0; i < tasksNeeded; i++) {
      CreepTaskQueue.addPendingRequest(request);
    }
  }
}

export class Upgrade extends CreepTask {
  
  protected init(): void {
    super.init();
    this.request.status = TaskStatus.PREPARE;
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == TaskStatus.FINISHED) return;

    var room = Game.rooms[this.request.roomName];
    var controller = room.controller as StructureController;
    var roomMem = room.memory as RoomMemory;
    //if (room.energyAvailable < 1000) return;
    if (this.creep.carry.energy < this.creep.carryCapacity) {

      if (this.collectFromContainer(room.name)) return;
      if (room.energyCapacityAvailable > 1200) {
        if (this.creep.carry.energy > 0) {
          this.request.status = TaskStatus.IN_PROGRESS
        }
        else {
          this.creep.moveTo(controller);
        }
        
        return;
      }
      if (this.collectFromDroppedEnergy(room.name)) return;
      if (this.collectFromTombstone(room.name)) return;
      if (this.collectFromStorage(room.name)) return;
      
      
      this.collectFromSource(room.name);

    }
    else this.request.status = TaskStatus.IN_PROGRESS;
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == TaskStatus.FINISHED) return;

    if (this.creep.room.name != this.request.roomName) {
      this.creep.moveTo(new RoomPosition(25, 25, this.request.roomName));
      return;
    }
    //const creep = Game.creeps[this.request.assignedTo];
    if (this.creep.carry.energy == 0) {
      this.request.status = TaskStatus.PREPARE;
      return;
    }
    const info = this.request as UpgradeRequest
    let controller = Game.getObjectById(info.targetID) as StructureController;
    if (this.creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
      this.creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
    }
    
  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

  static addRequests(roomName: string, maxPerRoom: number): void {
    let controller = Game.rooms[roomName].controller as StructureController;
    if (controller == undefined) return;
    let request = new UpgradeRequest(roomName, controller.id, maxPerRoom);
    let tasksNeeded = request.maxConcurrent - CreepTaskQueue.totalCount(roomName, request.name);
    for (let i = 0; i < tasksNeeded; i++) {
      CreepTaskQueue.addPendingRequest(request);
    }
  }
}

