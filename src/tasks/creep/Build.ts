import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepMemory, RoomMemory } from "utils/memory"
import { CreepTaskQueue } from "../CreepTaskQueue";
import { CreepRole } from "utils/utils";
import { TaskStatus, Task } from "../Task";
export class BuildRequest extends CreepTaskRequest {
  priority: number = 1;
  requiredRole: CreepRole[] = [CreepRole.ROLE_WORKER, CreepRole.ROLE_REMOTE_UPGRADER];
  name = "Build";
  maxConcurrent = 5;
  constructor(roomName: string, siteID: string) {
    super(roomName, `🚧`, siteID);
  }
}
export class ScoutRequest extends CreepTaskRequest {
  priority: number = 2;
  requiredRole: CreepRole[] = [CreepRole.ROLE_SCOUT];
  name = "Scout";
  maxConcurrent = 10;
  maxPerRoom = 1;
  claiming: boolean = false;
  constructor(roomName: string, siteID: string, claiming: boolean = false) {
    super(roomName, `👀`, siteID);
    this.claiming = claiming
  }
}


export class Scout extends CreepTask {

  protected init(): void {
    super.init();
    this.request.status = TaskStatus.PREPARE;
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == TaskStatus.FINISHED) return;

    var targetRoom = this.request.roomName;
    var targetPos = new RoomPosition(25, 25, targetRoom);

    this.creep.moveTo(targetPos);

    if (this.creep.room.name == targetRoom) {
      this.request.status = TaskStatus.IN_PROGRESS;
    }
    
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == TaskStatus.FINISHED) return;
    const creep = Game.creeps[this.request.assignedTo];
    var req = this.request as ScoutRequest;
    //creep.say("got here!");
    var controller = creep.room.controller as StructureController;
    if (controller == undefined) throw new Error("Can't put a claim flag in a room w/o a controller... derp");

    var result = req.claiming ? creep.claimController(controller) : creep.reserveController(controller);
    if (result == ERR_NOT_IN_RANGE) {
      creep.moveTo(controller)
    }
    
  }

  static addRequests(roomName: string): void {

    //var room = Game.rooms[this.creep.room.name];
    var flags = Game.flags;
    for (var id in flags) {
      var flag = flags[id] as Flag;
      //blue/blue = scout, blue/white  = claim
      if (flag.color == COLOR_BLUE) {
        var targetRoomName = flag.pos.roomName;

        var request = new ScoutRequest(targetRoomName, roomName)
        if (CreepTaskQueue.active(targetRoomName, request.name).length + CreepTaskQueue.pending(targetRoomName, request.name).length > 0) return;

        if (flag.secondaryColor == COLOR_BLUE) {
          request.claiming = true;
          CreepTaskQueue.addPendingRequest(request);
        }
        else if (flag.secondaryColor == COLOR_WHITE) {
          CreepTaskQueue.addPendingRequest(request);
        }
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
    this.request.status = TaskStatus.PREPARE;
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == TaskStatus.FINISHED) return;
    const info = this.request as BuildRequest;
    const site = Game.getObjectById(info.targetID) as ConstructionSite;
    if (site == null || site.progressTotal - site.progress == 0) {
      this.request.status = TaskStatus.FINISHED;
      return;
    }
    var room = Game.rooms[this.request.roomName];
    var roomMem = room.memory as RoomMemory;
    if (this.creep.carry.energy < this.creep.carryCapacity) {

      
      if (this.collectFromTombstone(room.name)) return;
      if (this.collectFromDroppedEnergy(room.name)) return;
      //if(this.collectFromContainer(room.name)) return;
      //if (this.collectFromMasterLink(room.name)) return;
      if (this.collectFromStorage(room.name)) return;
      if(this.collectFromSource(room.name)) return;

      //this.creep.moveTo(this.creep.room.controller as StructureController)
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
      this.request.status = TaskStatus.PREPARE;
    }
    //this caused huge errors!! BE CAREFUL ABOUT THIS...
    //else if(status !== undefined) {
    //  console.log(`${creep.name} couldn't build: ${status}`);
    //}
  }

  static addRequests(roomName: string): void {

    for (var name in Game.rooms) {
      let room = Game.rooms[name];
      let sites = room.find(FIND_CONSTRUCTION_SITES).sort(s => s.progress).reverse();
      const sorted = _.sortBy(sites, s => s.progress).reverse();

      //console.log("adding " + sites.length + " build site requests.")
      _.each(sorted, site => {

        if (site.progressTotal > 0) {
          CreepTaskQueue.addPendingRequest(new BuildRequest(name, site.id));
        }
      })
    }
    //let room = Game.rooms[roomName];
    //let sites = room.find(FIND_CONSTRUCTION_SITES).sort(s => s.progress).reverse();
    //const sorted = _.sortBy(sites, s => s.progress).reverse();
    ////console.log("adding " + sites.length + " build site requests.")
    //_.each(sorted, site => {
      
    //  if (site.progressTotal > 0) {
    //    CreepTaskQueue.addPendingRequest(new BuildRequest(roomName, site.id));
    //  }
    //})
  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

}
