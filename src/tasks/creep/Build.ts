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
  maxConcurrent = 2;
  constructor(roomName: string, siteID: string) {
    super(roomName, `👀`, siteID);
  }
}
export class RemoteUpgradeRequest extends CreepTaskRequest {
  priority: number = 2;
  requiredRole: CreepRole[] = [CreepRole.ROLE_REMOTE_UPGRADER];
  name = "RemoteUpgrade";
  maxConcurrent = 3;
  constructor(roomName: string, remoteControllerID: string) {
    super(roomName, `👀2`, remoteControllerID);
  }
}
//export class RemoteBuildRequest extends CreepTaskRequest {
//  priority: number = 2;
//  requiredRole: CreepRole = CreepRole.ROLE_REMOTE_BUILDER;
//  name = "RemoteBuild";
//  maxConcurrent = 1;
//  constructor(roomName: string, remoteControllerID: string) {
//    super(roomName, `👀2`, remoteControllerID);
//  }
//}

export class RemoteUpgrade extends CreepTask {

  protected init(): void {
    super.init();
    if (this.request.status == TaskStatus.FINISHED) return;

    var controller = Game.getObjectById(this.request.targetID) as StructureController;
    if (this.creep.room.name == controller.pos.roomName) {
      this.request.status = TaskStatus.PREPARE;
    }
    else {
      if (this.creep.room.name == controller.pos.roomName) {
        console.log("prep time")
        this.creep.moveTo(controller);
        this.request.status = TaskStatus.PREPARE;
      }
      else this.creep.moveTo(controller);
      if (this.creep.pos.roomName != controller.room.name || this.creep.room.name == controller.room.name && this.borderPosition(this.creep.pos)) {
        console.log("it happened: " + this.creep.pos.roomName + ", " + this.creep.room.name)
        this.creep.moveTo(new RoomPosition(25, 25, controller.room.name));
      }
     
      
    }
    
  }
  private borderPosition(pos: RoomPosition): boolean {
    return (this.creep.pos.x * this.creep.pos.y === 0 || this.creep.pos.x === 49 || this.creep.pos.y === 49);
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == TaskStatus.FINISHED) return;
    var room = this.creep.room;
    var roomMem = this.creep.room.memory as RoomMemory;
    //if (room.energyAvailable < 1000) return;
    if (this.creep.carry.energy < this.creep.carryCapacity) {

      //if (this.collectFromContainer(room.name)) return;
      //if (room.energyCapacityAvailable > 1300) return;
      //if (this.collectFromDroppedEnergy(room.name)) return;
      //if (this.collectFromTombstone(room.name)) return;
      //if (this.collectFromStorage(room.name)) return;


      this.collectFromSource(room.name);

    }
    else this.request.status = TaskStatus.IN_PROGRESS;
   
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == TaskStatus.FINISHED) return;
    if (this.creep.room.name != this.request.roomName) {
      this.creep.moveTo(new RoomPosition(25, 25, this.request.roomName));
      return;
    }
    if (this.creep.carry.energy == 0) {
      this.request.status = TaskStatus.PREPARE;
      return;
    }
    let controller = Game.getObjectById(this.request.targetID) as StructureController;
    if (this.creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
      this.creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
    }
    
  }

  static addRequests(roomName: string): void {

    //var room = Game.rooms[this.creep.room.name];
    var flags = Game.flags;
    for (var id in flags) {
      var flag = flags[id];
      if (flag.color == COLOR_BLUE && flag.secondaryColor == COLOR_BLUE) {
        var room = flag.room as Room;
        if (room == undefined) return;
        var controller = room.controller as StructureController;
        if (controller == undefined) return;
        var request = new RemoteUpgradeRequest(roomName, controller.id);
        let existingTaskCount = CreepTaskQueue.totalCount(roomName, request.name);
        let maxConcurrentCount = request.maxConcurrent;
        if (existingTaskCount < maxConcurrentCount) {
          CreepTaskQueue.addPendingRequest(request);
        }
      }
      
    }
    
  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

}
export class Scout extends CreepTask {

  protected init(): void {
    super.init();
    //console.log("scout init")
    this.request.status = TaskStatus.PREPARE;
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == TaskStatus.FINISHED) return;
    //console.log("scout prep")
    var room = Game.rooms[this.creep.room.name];
    //var flags = _.filter(Game.flags, f=>f.pos.roomName == this.creep.room.name);
    var flags = Game.flags
    var roomPosition: RoomPosition | undefined = undefined;
    //console.log("flags: " + JSON.stringify(flags))
    for (var id in flags) {
      var flag = flags[id];
      if (flag.color == COLOR_BLUE && flag.secondaryColor == COLOR_BLUE) {
        roomPosition = new RoomPosition(flag.pos.x, flag.pos.y, flag.pos.roomName);
        
        //var room = flag.room as Room;
        //if (room != undefined && this.creep.room.name == room.name) {
        //  this.creep.moveTo(flag)
        //}
        break;
      }
      
      //else if (flag.color == COLOR_BLUE && flag.secondaryColor == COLOR_BLUE) {
      //  if (flag.room != undefined && flag.room.name == this.creep.room.name)

      //    this.request.status = TaskStatus.IN_PROGRESS;
      //}
    }
    if (roomPosition != undefined) {
      this.creep.moveTo(roomPosition)
      if (this.creep.room.name == roomPosition.roomName) {
        this.request.status = TaskStatus.IN_PROGRESS;
      }
    };
   
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == TaskStatus.FINISHED) return;
    const creep = Game.creeps[this.request.assignedTo];

    //creep.say("got here!");
    var controller = creep.room.controller as StructureController;
    if (controller == undefined) throw new Error("Can't put a claim flag in a room w/o a controller... derp");

    var result = creep.claimController(controller);
    if (result == ERR_NOT_IN_RANGE) {
      creep.moveTo(controller)
    }
    
  }

  static addRequests(roomName: string): void {

    //var room = Game.rooms[this.creep.room.name];
    var flags = Game.flags;
    for (var id in flags) {
      var flag = flags[id];
      if (flag.color == COLOR_BLUE && flag.secondaryColor == COLOR_BLUE) {
        var room = flag.room as Room;
        var request = new ScoutRequest(roomName, flag.name)
        let existingTaskCount = CreepTaskQueue.totalCount(roomName, request.name);
        let maxConcurrentCount = request.maxConcurrent;
        if (existingTaskCount < maxConcurrentCount) {
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

    var room = Game.rooms[this.request.roomName];
    var roomMem = room.memory as RoomMemory;
    if (this.creep.carry.energy < this.creep.carryCapacity) {

     
      if (this.collectFromTombstone(room.name)) return;
      if (this.collectFromDroppedEnergy(room.name)) return;
      //if(this.collectFromContainer(room.name)) return;
      if (this.collectFromMasterLink(room.name)) return;
      if (this.collectFromStorage(room.name)) return;
      if(this.collectFromSource(room.name)) return;
      
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
