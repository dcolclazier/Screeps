import { CreepTaskRequest } from "../CreepTaskRequest";
import { CreepTask } from "../CreepTask";
import { CreepMemory, RoomMemory, SmartSource } from "utils/memory"
import * as utils from "utils/utils";
import { CreepTaskQueue } from "../CreepTaskQueue";
import { CreepRole } from "utils/utils";
import { Task, TaskStatus } from "../Task";

export class MineRequest extends CreepTaskRequest {
  priority: number = 1;
  requiredRole: CreepRole = CreepRole.ROLE_MINER
  name: string = "Mine";
  maxConcurrent: number;
  id: number
  source: SmartSource;
  constructor(roomName: string, sourceID: string) {
    super(roomName, `💲`, sourceID);

    const roomMem = Game.rooms[roomName].memory as RoomMemory;
    console.log("source id in mine req ctor: " + sourceID)

    this.source = _.find(roomMem.harvestLocations, h => h.sourceID == sourceID) as SmartSource;
    if (this.source == undefined) console.log("You cant init a mine request with an undefined source.")

    console.log("after finding source: " + this.source.sourceID)
    this.id = _.random(0, 10);
    this.maxConcurrent = utils.sourceCount(this.roomName);
  }
}

export class Mine extends CreepTask {
  protected init(): void {
    super.init();
    console.log("mine init assigned to " + this.request.assignedTo)

    const request = this.request as MineRequest;
    const source = request.source as SmartSource;
    source.assignedTo = request.assignedTo;
    this.request.status = TaskStatus.PREPARE;
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == TaskStatus.FINISHED) return;

    this.request.status = TaskStatus.IN_PROGRESS;
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == TaskStatus.FINISHED) return;

    if (this.creep.carry.energy < this.creep.carryCapacity) this.harvest();
    else this.deliver();

  }

  static addRequests(roomName: string): void {
    const room = Game.rooms[roomName];
    const mem = room.memory as RoomMemory;

    const unassigned = _.filter(mem.harvestLocations, h => h.assignedTo === null) as SmartSource[];
    if (unassigned.length === 0) return;

    for (const key in unassigned) {
      const smartSource = unassigned[key] as SmartSource;
      console.log("about to add source for this id: " + smartSource.sourceID)
      const request = new MineRequest(roomName, smartSource.sourceID);
      CreepTaskQueue.addPending(request);
    }
  }

  private harvest() {
    const creep = Game.creeps[this.request.assignedTo] as Creep;
    const source = Game.getObjectById(this.request.targetID) as Source
    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }

  }
  private deliver() {
    const creep = Game.creeps[this.request.assignedTo];
    const container = utils.findClosestContainer(this.request.roomName, creep.id, true, true) as StructureContainer;
    if (container == undefined) {
      creep.drop(RESOURCE_ENERGY);
      return;
    }

    if (container.store.energy == container.storeCapacity) return;

    if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
      creep.moveTo(container, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }

  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }
}

