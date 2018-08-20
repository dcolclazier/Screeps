import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { Task } from "../Task";
import { Traveler } from "Traveler";
import { CreepTaskQueue } from "../CreepTaskQueue";
import * as Utils from "utils/utils"

export class BuildRequest extends CreepTaskRequest {
  priority: number = 1;
  validRoles: CreepRole[] = ["ROLE_WORKER","ROLE_REMOTE_UPGRADER"];
  name = "Build";
  maxConcurrent = 5;
  constructor(originatingRoomName: string, targetRoomName: string, siteID: string) {
    super(originatingRoomName, targetRoomName, siteID, `🚧`);
  }
}
export class Build extends CreepTask {
  static taskName: string = "Build";
  protected init(): void {
    super.init();
    this.request.status = "PREPARE";
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == "FINISHED") return;
    const info = this.request as BuildRequest;
    const site = Game.getObjectById(info.targetID) as ConstructionSite;

    if (this.creep.carry.energy == this.creep.carryCapacity) {
      this.request.status = "IN_PROGRESS";
      return;
    }
    if (site == null || site.progressTotal - site.progress == 0) {
      this.request.status = "FINISHED";
      return;
    }
    var progressLeft = site.progressTotal - site.progress
    if (this.creep.carry.energy < progressLeft) {

      var roomName = this.request.originatingRoomName;
      if (this.collectFromTombstone(roomName)) return;
      if (this.collectFromDroppedEnergy(roomName)) return;
      if (this.collectFromStorage(roomName)) return;
      if (this.collectFromSource(roomName)) return;
    }
    else this.request.status = "IN_PROGRESS";

  }
  protected work(): void {
    super.work();
    
    if (this.request.status == "FINISHED") return;
    //const creep = Game.creeps[this.request.assignedTo];
    const site = Game.getObjectById<ConstructionSite>(this.request.targetID);
    if (site == null || site.progressTotal - site.progress == 0) {
      this.request.status = "FINISHED";
      return;
    }
    const result = this.creep.build(site);
    if (result == ERR_NOT_IN_RANGE) {
      this.creep.travelTo(site);
      //Traveler.travelTo(this.creep, site);
    }
    else if (this.creep.carry.energy == 0) {
      this.request.status = "PREPARE";
    }
  }

  static addRequests(roomName: string): void {

    for (var name in Game.rooms) {
      let sites = Game.rooms[name].find(FIND_CONSTRUCTION_SITES);
      const sorted = _.sortBy(sites, s => s.progress).reverse();

      _.each(sorted, site => {

        if (site.progressTotal > 0) {
          if(CreepTaskQueue.count(roomName, undefined, "Build", site.id) == 0)
            CreepTaskQueue.addPendingRequest(new BuildRequest(roomName, site.pos.roomName, site.id));
        }
      })
    }
    
  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

}
