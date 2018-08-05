import { CreepTask } from "tasks/CreepTask"
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "../CreepTaskQueue";
import * as utils from "utils/utils";
//import { RoomManager } from "RoomManager";

export class UpgradeRequest extends CreepTaskRequest {

  requiredRole : CreepRole[] = ["ROLE_UPGRADER"]
  priority: number = 5;
  name: string = "Upgrade"
  maxConcurrent: number;
  constructor(roomName: string, controllerID: string, maxPerRoom: number) {
    super(roomName, `🎇`, controllerID);
    this.maxConcurrent = maxPerRoom
  }
}
export class DefendRequest extends CreepTaskRequest {

  requiredRole: CreepRole[] = ["ROLE_DEFENDER"]
  priority: number = 0;
  name = "DEFEND";
  maxConcurrent: number;
  constructor(roomName: string, controllerID: string, maxPerRoom: number) {
    super(roomName, `🎇`, controllerID);
    this.maxConcurrent = maxPerRoom
  }
}

export class Defend extends CreepTask {
  public name: string = "Defend";

  
  northDefendPositionW6S43_1: RoomPosition = new RoomPosition(33,4,"W6S43");
  northDefendPositionW6S43_2: RoomPosition = new RoomPosition(33,6,"W6S43");
  northDefendPositionW6S43_3: RoomPosition = new RoomPosition(33, 7, "W6S43");

  protected init(): void {
    super.init();
    this.request.status = "PREPARE";

  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == "FINISHED") return;

    var room = Game.rooms[this.request.requestingRoomName];
    var roomMem = room.memory as RoomMemory;
    this.request.status = "IN_PROGRESS";
    //if (room.energyAvailable < 1000) return;
    //if (this.creep.carry.energy == 0) {

    //  if (this.collectFromContainer(room.name)) return;
    //  if (room.energyCapacityAvailable > 1300) return;
    //  if (this.collectFromDroppedEnergy(room.name)) return;
    //  if (this.collectFromTombstone(room.name)) return;
    //  if (this.collectFromStorage(room.name)) return;
      
      
    //  //this.collectFromSource(room.name);

    //}
    //else this.request.status = "IN_PROGRESS";
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == "FINISHED") return;
    var room = Game.rooms[this.request.requestingRoomName];
    var roomMem = room.memory as RoomMemory;
    var enemies = room.find(FIND_HOSTILE_CREEPS).sort(e => e.hits);
    var closestRampartToEn
    if (enemies.length == 0) {
      this.request.status = "FINISHED";
      return;
    }
    var lowest = _.first(enemies);
    if (this.creep.attack(lowest) == ERR_NOT_IN_RANGE) {
      this.creep.moveTo(lowest);
    }
    
    //const creep = Game.creeps[this.request.assignedTo];
    //if (this.creep.carry.energy == 0) {
    //  this.request.status = "PREPARE";
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
    this.request.status = "PREPARE";
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == "FINISHED") return;

    var room = Game.rooms[this.request.requestingRoomName];
    if(room == undefined || room.controller === undefined) throw Error("Room or Controller was undefined in upgrade...")

    var roomName = room.name;
    //if (room.energyAvailable < 1000) return;
    if (this.creep.carry.energy < this.creep.carryCapacity) {

      if (this.collectFromContainer(roomName)) return;
      if (room.energyCapacityAvailable > 1200) {
        if (this.creep.carry.energy > 0) {
          this.request.status = "IN_PROGRESS"
        }
        else {
          this.creep.travelTo(room.controller);
        }
        
        return;
      }
      if (this.collectFromDroppedEnergy(roomName)) return;
      if (this.collectFromTombstone(roomName)) return;
      if (this.collectFromStorage(roomName)) return;
      
      
      this.collectFromSource(roomName);

    }
    else this.request.status = "IN_PROGRESS";
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == "FINISHED") return;

    if (this.creep.room.name != this.request.requestingRoomName) {
      this.creep.moveTo(new RoomPosition(25, 25, this.request.requestingRoomName));
      return;
    }
    //const creep = Game.creeps[this.request.assignedTo];
    if (this.creep.carry.energy == 0) {
      this.request.status = "PREPARE";
      return;
    }
    const info = this.request as UpgradeRequest
    let controller = Game.getObjectById(info.targetID) as StructureController;
    var sign = controller.sign as SignDefinition;
    if (sign == undefined || sign.username != "KeyserSoze") {
      var result = this.creep.signController(controller, "The greatest trick the devil ever pulled was convincing the world he did not exist.");
      if (result == ERR_NOT_IN_RANGE) this.creep.moveTo(controller);
    }

    if (this.creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
      this.creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
    }
    
  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

  static addRequests(roomName: string, maxPerRoom: number): void {
    let controller = Game.rooms[roomName].controller as StructureController;
    var upgraderCount = utils.creepCount(roomName, "ROLE_UPGRADER");
    if (controller == undefined || upgraderCount == 0) return;
    let tasksNeeded = upgraderCount - CreepTaskQueue.totalCount(roomName, "Upgrade");
    for (let i = 0; i < tasksNeeded; i++) {
      CreepTaskQueue.addPendingRequest(new UpgradeRequest(roomName, controller.id, upgraderCount));
    }
  }
}

