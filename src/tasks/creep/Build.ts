import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "../CreepTaskQueue";
import { Task } from "../Task";
import { Traveler } from "Traveler";
export class BuildRequest extends CreepTaskRequest {
  priority: number = 1;
  requiredRole: CreepRole[] = ["ROLE_WORKER","ROLE_REMOTE_UPGRADER"];
  name = "Build";
  maxConcurrent = 2;
  constructor(roomName: string, siteID: string) {
    super(roomName, `🚧`, siteID);
  }
}
export class DismantleRequest extends CreepTaskRequest {
  priority: number = 1;
  requiredRole: CreepRole[] = ["ROLE_WORKER", "ROLE_DISMANTLER"];
  name = "Dismantle";
  maxConcurrent = 2;
  constructor(roomName: string, siteID: string) {
    super(roomName, `🚧2`, siteID);
  }
}


export class Dismantle extends CreepTask {

  protected init(): void {
    super.init();
    this.request.status = "PREPARE";
  }

  protected prepare(): void {
    super.prepare();
    this.request.status = "IN_PROGRESS";
  }
  protected continue(): void {
    super.continue();
    
    if (this.request.status == "FINISHED") return;
    const creep = Game.creeps[this.request.assignedTo];
    const site = Game.getObjectById<AnyStructure>(this.request.targetID);
    if (site == null) {
      this.request.status = "FINISHED";
      return;
    }
    const result = creep.dismantle(site);
    
    if (result == ERR_NOT_IN_RANGE) {
      Traveler.travelTo(this.creep, site);
    }
    if (creep.carry.energy == this.creep.carryCapacity) {
      creep.drop(RESOURCE_ENERGY);
    }
  }

  static addRequests(roomName: string): void {

    var room = Game.rooms[roomName];
    var flags = _.filter(Game.flags, f => f.color == COLOR_YELLOW && f.secondaryColor == COLOR_YELLOW);
    if (flags.length == 0) return;

    for (var i in flags) {
      var flag = flags[i];
      var structureType = flag.name as StructureConstant;
      var test = room.lookForAt("structure", flag.pos.x, flag.pos.y);
      var dismantle = _.first(test.filter(t => t.structureType == "constructedWall"));
      if (dismantle == undefined) return;
      var request = new DismantleRequest(roomName, dismantle.id)
      if (CreepTaskQueue.active(roomName, request.name, request.targetID).length < 2) {
        CreepTaskQueue.addPendingRequest(request);
      }
        

    }
    
  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

}

export class Build extends CreepTask {

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

      var roomName = this.request.roomName;
      if (this.collectFromTombstone(roomName)) return;
      if (this.collectFromDroppedEnergy(roomName)) return;
      if (this.collectFromStorage(roomName)) return;
      if (this.collectFromSource(roomName)) return;
    }
    else this.request.status = "IN_PROGRESS";

  }
  protected continue(): void {
    super.continue();
    
    if (this.request.status == "FINISHED") return;
    const creep = Game.creeps[this.request.assignedTo];
    const site = Game.getObjectById<ConstructionSite>(this.request.targetID);
    if (site == null || site.progressTotal - site.progress == 0) {
      this.request.status = "FINISHED";
      return;
    }
    const result = creep.build(site);
    if (result == ERR_NOT_IN_RANGE) {
      Traveler.travelTo(this.creep, site);
    }
    else if (creep.carry.energy == 0) {
      this.request.status = "PREPARE";
    }
  }

  static addRequests(roomName: string): void {

    for (var name in Game.rooms) {
      let sites = Game.rooms[name].find(FIND_CONSTRUCTION_SITES);
      const sorted = _.sortBy(sites, s => s.progress).reverse();

      _.each(sorted, site => {

        if (site.progressTotal > 0) {
          CreepTaskQueue.addPendingRequest(new BuildRequest(name, site.id));
        }
      })
    }
    
  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

}
