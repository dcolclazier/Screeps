import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { Task } from "../Task";
import { Traveler } from "Traveler";
import { CreepTaskQueue } from "../CreepTaskQueue";
import * as Utils from "utils/utils"

export class BuildRequest extends CreepTaskRequest {
  priority: number = 1;
  validRoles: CreepRole[] = ["ROLE_WORKER", "ROLE_REMOTE_UPGRADER"];
  name = "Build";
  maxConcurrent = 5;
  siteType!: StructureConstant;
  constructor(originatingRoomName: string, targetRoomName: string, siteID: string) {
    super(originatingRoomName, targetRoomName, siteID, `🚧`);
  }
}
export class Build extends CreepTask {
  static taskName: string = "Build";
  protected init(): void {
    super.init();

    if (this.creep.room.name == this.request.targetRoomName) {
      if ((this.creep.pos.x >= 1 && this.creep.pos.x <= 48) && (this.creep.pos.y >= 1 && this.creep.pos.y <= 48))
        this.request.status = "PREPARE";
      else this.creep.travelTo(new RoomPosition(25, 25, this.request.targetRoomName));
    }
    else this.creep.travelTo(new RoomPosition(25, 25, this.request.targetRoomName));
    //this.request.status = "PREPARE";
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == "FINISHED") return;
    const info = this.request as BuildRequest;
    const site = Game.getObjectById(info.targetID) as ConstructionSite;
    
    if (this.creep.carry.energy == this.creep.carryCapacity) {
      this.request.status = "WORK";
      return;
    }
    if (site == null || site.progressTotal - site.progress == 0) {
      this.request.status = "FINISHED";
      return;
    }
    info.siteType = site.structureType;
    var progressLeft = site.progressTotal - site.progress
    if (this.creep.carry.energy < progressLeft) {

      var roomName = this.request.targetRoomName;
      //if (this.collectFromTombstone(roomName)) return;
      if (this.flee2(6, roomName)) return;
      if (this.collectFromMasterLink(roomName)) return;
      if (this.collectFromStorage(roomName)) return;
      if (this.collectFromContainer(roomName)) return;
      if (this.collectFromDroppedEnergy(roomName)) return;
      if (this.collectFromSource(roomName)) return;
      //if (this.creep.carry.energy > 150) this.request.status == "IN_PROGRESS"
    }
    else this.request.status = "WORK";

  }
  protected work(): void {
    super.work();

    if (this.request.status == "FINISHED") return;
    if (this.flee2(6, this.request.targetRoomName)) return;
    //const creep = Game.creeps[this.request.assignedTo];
    const site = Game.getObjectById<ConstructionSite>(this.request.targetID);
    const info = this.request as BuildRequest;
    if (site == null || site.progressTotal - site.progress == 0) {
      if (info.siteType == "tower") global.roomManager.towers(this.request.targetRoomName, true)
      else if (info.siteType == "container") global.roomManager.containers(this.request.targetRoomName, true)
      else if (info.siteType == "link") global.roomManager.links(this.request.targetRoomName, true)
      this.request.status = "FINISHED";
      return;
    }

    if (this.creep.carry.energy == 0) {
      this.request.status = "PREPARE";
      return;
    }
    const result = this.creep.build(site);
    if (result == ERR_NOT_IN_RANGE) {
      this.creep.travelTo(site);
      //Traveler.travelTo(this.creep, site);
    }

  }

  static addRequests(roomName: string): void {

    const room = Game.rooms[roomName];
    const roomMem = Memory.rooms[roomName];
    if (room == undefined) return;
    const sites = _.sortBy(room.find(FIND_CONSTRUCTION_SITES), s => s.progress).reverse();

    var targetRoomName = roomName;
    var originatingRoomName = roomMem.roomType == "REMOTE_HARVEST" || roomMem.roomType == "SOURCE_KEEPER"? (<RemoteHarvestRoomMemory>roomMem).baseRoomName : roomName;

    _.forEach(sites, site => {
      if (site.progressTotal > 0) {
        if (CreepTaskQueue.count(originatingRoomName, targetRoomName, "Build", site.id) == 0)
          CreepTaskQueue.addPendingRequest(new BuildRequest(originatingRoomName, site.pos.roomName, site.id));
      }
    })

    //for (var name in Game.rooms) {
    //    let sites = Game.rooms[name].find(FIND_CONSTRUCTION_SITES);
    //    const sorted = _.sortBy(sites, s => s.progress).reverse();

    //    _.each(sorted, site => {

    //        if (site.progressTotal > 0) {
    //            if (CreepTaskQueue.count(roomName, targetRoomName, "Build", site.id) == 0)
    //                CreepTaskQueue.addPendingRequest(new BuildRequest(roomName, site.pos.roomName, site.id));
    //        }
    //    })
    //}

  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

}
