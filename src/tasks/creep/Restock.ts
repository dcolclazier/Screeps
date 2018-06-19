import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "../CreepTaskQueue";
import * as utils from "utils/utils"
import { CreepRole } from "utils/utils";
import { CreepMemory, RoomMemory } from "utils/memory";
import { TaskStatus, Task } from "../Task";

export class RestockRequest extends CreepTaskRequest {
  priority: number = 1;
  name = "Restock";
  requiredRole = CreepRole.ROLE_WORKER
  maxConcurrent = 3;
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
    this.request.status = TaskStatus.PREPARE;
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == TaskStatus.FINISHED) return;
    const restockInfo = this.request as RestockRequest;
    var room = Game.rooms[this.request.roomName];
    var roomMem = room.memory as RoomMemory;
    //this.collectFromContainer(this.request.roomName, creep.id);

    //temp code...
    if (this.creep.carry.energy < this.creep.carryCapacity) {
      let resources = room.find(FIND_DROPPED_RESOURCES) as Resource[];
      if (resources.length > 0) {
        for (const key in resources) {
          if (!resources.hasOwnProperty(key)) continue;
          const resource = resources[key] as Resource;
          if (resource.resourceType != RESOURCE_ENERGY) continue;

          if (this.creep.pickup(resource) == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(resource);
          }
        }
      }
      else {
        var sourceID = _.first(roomMem.harvestLocations).sourceID;
        var source = Game.getObjectById(sourceID) as Source
        if (this.creep.harvest(source) == ERR_NOT_IN_RANGE) {
          this.creep.moveTo(source);
        }
      }

    }
    else {
      this.request.status = TaskStatus.IN_PROGRESS;
    }
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == TaskStatus.FINISHED) return;
    const creep = Game.creeps[this.request.assignedTo];

    let targets = creep.room.find(FIND_STRUCTURES, {
      filter: (structure) => {
        return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
          structure.energy < structure.energyCapacity;
      }
    }).sort((structureA, structureB) => creep.pos.getRangeTo(structureA) - creep.pos.getRangeTo(structureB));
    //console.log("restock targets: " + targets.length);
    if (targets.length == 0) {
      this.request.status = TaskStatus.FINISHED;
    }
    else {
      const result = creep.transfer(targets[0], RESOURCE_ENERGY)
      const target = targets[0]
      if (result == ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      else if (result == OK) {
        this.request.status = TaskStatus.FINISHED;
      }
      else {
        //console.log(`${creep.name} couldn't restock: ${result}`)
        this.request.status = TaskStatus.FINISHED;
      }
    }
  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

  static addRequests(roomName: string) {
    let restockables = utils.getRestockables(roomName);
    //let workers = utils.creepNamesByRole(roomName, CreepRole.ROLE_WORKER).filter(name => {
    //  const worker = Game.creeps[name] as Creep;
    //  return worker.carry.energy > 0;
    //})
    //if (workers.length == 0) return;

    for (const targetID in restockables) {
      let restockable = restockables[targetID];
      let request = new RestockRequest(roomName, restockable.id);
      let existingTaskCount = CreepTaskQueue.totalCount(roomName, request.name);
      let maxConcurrentCount = request.maxConcurrent;

      if (existingTaskCount < maxConcurrentCount) {
        CreepTaskQueue.addPendingRequest(request)
      }
    }
  }
}
