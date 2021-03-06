import { CreepTask } from "../CreepTask";
import { CreepTaskRequest } from "../CreepTaskRequest";
import { CreepTaskQueue } from "../CreepTaskQueue";
import * as utils from "utils/utils"

export class PickUpEnergyRequest extends CreepTaskRequest {
  priority: number = 0;
  name: string = "PickupEnergy";
  validRoles: CreepRole[] = ["ROLE_WORKER"];
  maxConcurrent: number = 2;
  resourceType: string;
  constructor(roomName: string, resourceID: string, resourceType: string) {
    super(roomName, roomName, resourceID, "😍");
    this.resourceType = resourceType;
  }
}
export class PickupEnergy extends CreepTask {
  static taskName: string = "PickupEnergy";
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }
  protected init(): void {
    super.init();
    //console.log("mine init assigned to " + this.request.assignedTo)

    this.request.status = "PREPARE";
  }
  protected prepare(): void {
    super.prepare();
    if (this.request.status == "FINISHED") return;

    this.request.status = "WORK";
  }

  protected work() {
    const requestInfo = this.request as PickUpEnergyRequest;
    const resource = Game.getObjectById(this.request.targetID);
    if (resource == null) {
      this.request.status = "FINISHED";
      return;
    }
    if (requestInfo.resourceType == "tombstone") {
      let tombstone = resource as Tombstone;
      if (this.creep.withdraw(tombstone, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        this.creep.travelTo(tombstone);
      }
      else this.request.status = "FINISHED";
    }
    else if (requestInfo.resourceType == "resource") {
      let droppedResource = resource as Resource;
      if (this.creep.pickup(droppedResource) == ERR_NOT_IN_RANGE) {
        this.creep.travelTo(droppedResource);
      }
      else this.request.status = "FINISHED";
    }
  }

  static addRequests(roomName: string): void {
    let room = Game.rooms[roomName];
    let resources = room.find(FIND_DROPPED_RESOURCES) as Resource[];
    let tombstones = room.find(FIND_TOMBSTONES) as Tombstone[];

      let workers = global.creepManager.creeps(roomName, "ROLE_WORKER").filter(name => {
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
        //console.log("found a tombstone with energy")
        let ts = new PickUpEnergyRequest(roomName, tombstone.id, "resource")
        if (CreepTaskQueue.count(roomName, undefined, ts.name) < ts.maxConcurrent) {
          CreepTaskQueue.addPendingRequest(ts);
        }
      }
    }
  }
 
  
}

