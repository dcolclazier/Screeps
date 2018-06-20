import { CreepTask } from "tasks/CreepTask"
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "../CreepTaskQueue";
import { CreepMemory } from "utils/memory";
//import { RoomManager } from "RoomManager";
import { CreepRole } from "utils/utils";
import { TaskStatus } from "tasks/Task";

export class UpgradeRequest extends CreepTaskRequest {

  requiredRole = CreepRole.ROLE_UPGRADER 
  priority: number = 5;
  name = "Upgrade";
  maxConcurrent: number;
  constructor(roomName: string, controllerID: string, maxPerRoom: number) {
    super(roomName, `🎇`, controllerID);
    this.maxConcurrent = maxPerRoom
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
    var roomMem = room.memory as RoomMemory;
    if (this.creep.carry.energy == 0) {

      this.collectFromDroppedEnergy(room.name);
      this.collectFromTombstone(room.name);
      //this.collectFromSource(room.name);

    }
    else this.request.status = TaskStatus.IN_PROGRESS;
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == TaskStatus.FINISHED) return;
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
    let request = new UpgradeRequest(roomName, controller.id, maxPerRoom);
    let tasksNeeded = request.maxConcurrent - CreepTaskQueue.totalCount(roomName, request.name);
    for (let i = 0; i < tasksNeeded; i++) {
      CreepTaskQueue.addPendingRequest(request);
    }
  }
}

