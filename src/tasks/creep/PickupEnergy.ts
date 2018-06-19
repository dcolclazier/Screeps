import { CreepTask } from "../CreepTask";
import { CreepTaskRequest } from "../CreepTaskRequest";
import { CreepRole } from "utils/utils";
import { CreepTaskQueue } from "../CreepTaskQueue";
import * as utils from "utils/utils"
import { TaskStatus } from "tasks/Task";

export class PickUpEnergyRequest extends CreepTaskRequest {
  priority: number = 0;
  name: string = "PickupEnergy";
  requiredRole: CreepRole = CreepRole.ROLE_WORKER;
  maxConcurrent: number = 2;
  resourceType: string;
  constructor(roomName: string, resourceID: string, resourceType: string) {
    super(roomName, "😍", resourceID);
    this.resourceType = resourceType;
  }
}
export class PickupEnergy extends CreepTask {


  protected init(): void {
    super.init();
    //console.log("mine init assigned to " + this.request.assignedTo)

    this.request.status = TaskStatus.PREPARE;
  }
  protected prepare(): void {
    super.prepare();
    if (this.request.status == TaskStatus.FINISHED) return;

    this.request.status = TaskStatus.IN_PROGRESS;
  }

  protected continue() {
    const requestInfo = this.request as PickUpEnergyRequest;
    const resource = Game.getObjectById(this.request.targetID);
    if (resource == null) {
      this.request.status = TaskStatus.FINISHED;
      return;
    }
    if (requestInfo.resourceType == "tombstone") {
      let tombstone = resource as Tombstone;
      if (this.creep.withdraw(tombstone, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        this.creep.moveTo(tombstone);
      }
      else this.request.status = TaskStatus.FINISHED;
    }
    else if (requestInfo.resourceType == "resource") {
      let droppedResource = resource as Resource;
      if (this.creep.pickup(droppedResource) == ERR_NOT_IN_RANGE) {
        this.creep.moveTo(droppedResource);
      }
      else this.request.status = TaskStatus.FINISHED;
    }
  }

  static addRequests(roomName: string): void {
    let room = Game.rooms[roomName];
    let resources = room.find(FIND_DROPPED_RESOURCES) as Resource[];
    let tombstones = room.find(FIND_TOMBSTONES) as Tombstone[];

    let workers = utils.creepNamesByRole(roomName, CreepRole.ROLE_WORKER).filter(name => {
      const worker = Game.creeps[name] as Creep;
      return worker.carry.energy < worker.carryCapacity;
    })
    if (workers.length == 0) return;

    if (resources.length > 0) {
      //console.log("found " + resources.length + " dropped resources")
      for (const key in resources) {
        if (!resources.hasOwnProperty(key)) continue;
        const resource = resources[key] as Resource;
        if (resource.resourceType != RESOURCE_ENERGY) continue;

        let droppedReq = new PickUpEnergyRequest(roomName, resource.id, "resource")
        CreepTaskQueue.addPendingRequest(droppedReq);
      }
    }
    if (tombstones.length > 0) {
      for (const key in tombstones) {
        if (!tombstones.hasOwnProperty(key)) continue;
        const tombstone = tombstones[key] as Tombstone;
        if (tombstone.store.energy == 0) continue;
        console.log("found a tombstone with energy")
        let ts = new PickUpEnergyRequest(roomName, tombstone.id, "resource")
        if (CreepTaskQueue.totalCount(roomName, ts.name) < ts.maxConcurrent) {
          CreepTaskQueue.addPendingRequest(ts);
        }
      }
    }
  }
  //private deliver() {
  //  let creep = Game.creeps[this.request.assignedTo];
  //  let container = utils.findClosestContainer(this.request.roomName, creep.id, false, true) as StructureContainer;
  //  if (container == undefined) throw "Error!";

  //  if (container.store.energy == container.storeCapacity) return;

  //  if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
  //    creep.moveTo(container, { visualizePathStyle: { stroke: '#ffffff' } });
  //  }
  //}
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }
}

