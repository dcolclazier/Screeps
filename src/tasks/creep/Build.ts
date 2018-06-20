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
  maxConcurrent = 3;
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
    if (this.creep.carry.energy == 0) {

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
    //this caused huge errors!! BE CAREFUL ABOUT THIS...
    //else if(status !== undefined) {
    //  console.log(`${creep.name} couldn't build: ${status}`);
    //}
  }

  static addRequests(roomName: string): void {
    let room = Game.rooms[roomName];
    let sites = room.find(FIND_CONSTRUCTION_SITES);
    //console.log("adding " + sites.length + " build site requests.")
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
