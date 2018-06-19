import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepMemory, RoomMemory } from "utils/memory"
import { CreepTaskQueue } from "../CreepTaskQueue";
import { CreepRole } from "utils/utils";
import { TaskStatus, Task } from "../Task";
export class BuildRequest extends CreepTaskRequest {
  priority: number = 2;
  requiredRole: CreepRole = CreepRole.ROLE_WORKER;
  name = "Build";
  maxConcurrent = 2;
  constructor(roomName: string, siteID: string) {
    super(roomName, `🚧`, siteID);
  }
}

export class Build extends CreepTask {

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

    const info = this.request as BuildRequest;
    const site = Game.getObjectById(info.targetID) as ConstructionSite;
    if (site == null || site.progressTotal - site.progress == 0) {
      this.request.status = TaskStatus.FINISHED;
      return;
    }
    const result = creep.build(site);
    if (result == ERR_NOT_IN_RANGE) {
      creep.moveTo(site, { visualizePathStyle: { stroke: '#ffffff' } });
    }
    else if (creep.carry.energy == 0) {
      this.request.status = TaskStatus.FINISHED;
    }
    //else if(status !== undefined) {
    //  console.log(`${creep.name} couldn't build: ${status}`);
    //}
  }

  static addRequests(roomName: string): void {
    let room = Game.rooms[roomName];
    let sites = room.find(FIND_CONSTRUCTION_SITES);
    console.log("adding " + sites.length + " build site requests.")
    _.each(sites, site => {
      
      if (site.progressTotal > 0) {
        CreepTaskQueue.addPendingRequest(new BuildRequest(roomName, site.id));
      }
    })
  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

}
