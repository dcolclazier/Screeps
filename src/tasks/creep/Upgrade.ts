import { CreepTask } from "tasks/CreepTask"
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "../CreepTaskQueue";
import { CreepMemory } from "utils/memory";
import { RoomManager } from "RoomManager";
import { CreepRole } from "utils/utils";
import { TaskStatus } from "tasks/Task";

export class UpgradeRequest extends CreepTaskRequest {

  requiredRole = CreepRole.ROLE_UPGRADER
  priority: number = 1;
  name = "Upgrade";
  maxConcurrent = RoomManager.maxUpgradersPerRoom;
  constructor(roomName: string, controllerID: string) {
    super(roomName, `🎇`, controllerID);
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
    if (this.creep.carry.energy < this.creep.carryCapacity) {

      this.collectFromDroppedEnergy(room.name);
      this.collectFromTombstone(room.name);
      this.collectFromSource(room.name);

    }
    else this.request.status = TaskStatus.IN_PROGRESS;
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == TaskStatus.FINISHED) return;
    const creep = Game.creeps[this.request.assignedTo];

    const info = this.request as UpgradeRequest
    let controller = Game.getObjectById(info.targetID) as StructureController;
    if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
      creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
    }
    if (creep.carry.energy == 0) {
      this.request.status = TaskStatus.PREPARE;
    }
  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

  static addRequests(roomName: string): void {
    let controller = Game.rooms[roomName].controller as StructureController;
    let request = new UpgradeRequest(roomName, controller.id);
    let tasksNeeded = request.maxConcurrent - CreepTaskQueue.totalCount(roomName, request.name);
    for (let i = 0; i < tasksNeeded; i++) {
      CreepTaskQueue.addPendingRequest(request);
    }
  }
}

