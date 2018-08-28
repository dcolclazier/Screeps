import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "tasks/CreepTaskQueue";
import * as utils from "utils/utils"


export class FillStorageRequest extends CreepTaskRequest {
  priority: number = 4;
  name = "FillStorage";
  validRoles: CreepRole[] = ["ROLE_CARRIER"]
  maxConcurrent = 2;
  constructor(roomName: string, storageID: string) {
    super(roomName, roomName, storageID, `💰`);
  }
}
export class RemotePickupRequest extends CreepTaskRequest {
  priority: number = 4;
  name = "RemotePickup";
  validRoles: CreepRole[] = ["ROLE_REMOTE_CARRIER"]
  maxConcurrent = 1;
  constructor(originatingRoomName: string, targetRoomName: string, dropOffStructureID: string) {
    super(originatingRoomName, targetRoomName, dropOffStructureID, `💰2`);
  }
}

export class FillStorage extends CreepTask {
  static taskName: string = "FillStorage";
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

  sources: Source[] = []
  protected init(): void {
    super.init();

    var fillStorage = this.request as FillStorageRequest;

    //console.log("status after init" + Task.getStatus(this.request.status))
    this.request.status = "PREPARE";
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == "FINISHED") return;
    const restockInfo = this.request as FillStorageRequest;
    var room = Game.rooms[this.request.targetRoomName];
    var roomMem = room.memory as OwnedRoomMemory;

    if (this.creep.carry.energy == 0) {
      if (this.collectFromTerminal(room.name)) return;
      if (this.collectFromMasterLink(room.name)) return;
      if (this.collectFromDroppedEnergy(room.name)) return;
      if (this.collectFromTombstone(room.name)) return;

      if (this.collectFromContainer(room.name)) return;

      //this.collectFromSource(room.name);
      //this.creep.travelTo(this.creep.room.storage);
      this.request.status = "FINISHED";
    }
    else {
      this.request.status = "IN_PROGRESS";
    }
  }
  protected work(): void {
    super.work();
    if (this.request.status != "IN_PROGRESS") return;
    const storage = <StructureStorage>Game.getObjectById(this.request.targetID)
    if (storage == undefined) {
      this.request.status = "FINISHED";
      return;
    }
    if (storage.storeCapacity == _.sum(storage.store)) {
      this.request.status = "FINISHED";
      return;
    }
    const result = this.creep.transfer(storage, _.findKey(this.creep.carry) as ResourceConstant)
    if (result == ERR_NOT_IN_RANGE) {
      this.creep.travelTo(storage);
    }
    if (_.findKey(this.creep.carry) == undefined) {
      this.request.status = "FINISHED";
    }

  }


  static addRequests(roomName: string) {

    const room = Game.rooms[roomName];
    if (room == undefined) return;
    let storages = room.find(FIND_MY_STRUCTURES).filter(s => s.structureType == "storage") as StructureStorage[];

    const storage = room.storage;
    if (storage == undefined) return;

    let request = new FillStorageRequest(roomName, storage.id);
    let existingTaskCount = CreepTaskQueue.count(roomName, undefined, request.name);
    let maxConcurrentCount = request.maxConcurrent;

    if (existingTaskCount < maxConcurrentCount) {
      CreepTaskQueue.addPendingRequest(request)
    }

  }
}
export class RemotePickup extends CreepTask {
  static taskName: string = "RemotePickup";
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

  sources: Source[] = []
  protected init(): void {
    super.init();

    if (this.creep == undefined || this.creep == null) {
      this.request.status = "FINISHED";
      return;
    }
    if (_.sum(this.creep.carry) == this.creep.carryCapacity) {
      this.request.status = "IN_PROGRESS";
    }
    if (this.request.status != "INIT") return;
    //if (_.sum(this.creep.carry) != 0) {
    //    this.request.status = "IN_PROGRESS";
    //    return;
    //}


    //var fillStorage = this.request as RemotePickupRequest;
    if (this.creep.room.name == this.request.targetRoomName) {
      if ((this.creep.pos.x >= 1 && this.creep.pos.x <= 48) && (this.creep.pos.y >= 1 && this.creep.pos.y <= 48))
        this.request.status = "PREPARE";
      else this.creep.travelTo(new RoomPosition(25, 25, this.request.targetRoomName));
    }
    else this.creep.travelTo(new RoomPosition(25, 25, this.request.targetRoomName));
    //console.log("status after init" + Task.getStatus(this.request.status))
    //this.request.status = "PREPARE";
  }

  protected prepare(): void {
    super.prepare();
    if (this.creep == undefined || this.creep == null) {
      this.request.status = "FINISHED";
      return;
    }
    if (this.creep.room.name != this.request.targetRoomName) {
      this.request.status = "INIT";
    }
    if (_.sum(this.creep.carry) == this.creep.carryCapacity) {
      this.request.status = "IN_PROGRESS";
    }
    if (this.request.status != "PREPARE") return;

    const restockInfo = this.request as FillStorageRequest;
    var room = Game.rooms[this.request.targetRoomName];
    var roomMem = Memory.rooms[this.request.targetRoomName] as RemoteHarvestRoomMemory;

    if (this.collectFromDroppedEnergy(room.name)) return;
    if (this.collectFromTombstone(room.name)) return;
    if (this.collectFromContainer(room.name)) return;

  }
  protected work(): void {
    super.work();
    if (this.creep == undefined || this.creep == null) {
      this.request.status = "FINISHED";
      return;
    }
    if (_.sum(this.creep.carry) == 0) {
      this.request.status = "PREPARE";
      return;
    }
    if (this.request.status != "IN_PROGRESS") return;

    //repair roads in target room name
    if (this.creep.room.name == this.request.targetRoomName) {
      var roads = this.creep.room.find(FIND_STRUCTURES).filter(s => s.structureType == "road" && s.hits < s.hitsMax * .90 && this.creep.pos.inRangeTo(s.pos, 4)) as StructureRoad[];
      var byMin = _.sortBy(roads, r => r.hits);
      if (byMin.length > 0) this.creep.repair(byMin[0]);
    }
    //drop off energy
    var links = global.roomManager.links(this.request.originatingRoomName).filter(l => l.pos.findInRange(FIND_EXIT, 3).length > 0)
    if (links.length > 1) {
      //console.log("found some!")
      links = _.sortBy(_.filter(links, l => l.linkMode === "SEND"), l => l.pos.getRangeTo(this.creep.pos))
      //console.log(JSON.stringify(links, null, 2));
    }
    const dropOff = links.length == 0 ? <StructureLink | StructureContainer | StructureStorage>Game.getObjectById(this.request.targetID)
      : <StructureLink>Game.getObjectById(links[0].id);
    //const dropOff = <StructureLink | StructureContainer | StructureStorage>Game.getObjectById(this.request.targetID)
    const result = this.creep.transfer(dropOff, <ResourceConstant>_.findKey(this.creep.carry));
    if (result == ERR_NOT_IN_RANGE) {
      this.creep.travelTo(dropOff);
      this.creep.transfer(dropOff, <ResourceConstant>_.findKey(this.creep.carry));
    }
    else if (result == ERR_FULL && _.sum(this.creep.carry) < this.creep.carryCapacity) {
      this.request.status = "PREPARE";
    }
  }


  static addRequests(roomName: string) {

    const roomMem = <RemoteHarvestRoomMemory>Memory.rooms[roomName];
    if (roomMem.roomType != "REMOTE_HARVEST") return;

    const sourceCount = global.roomManager.sources(roomName).length;
    const currentTaskCount = CreepTaskQueue.getTasks(roomMem.baseRoomName, roomName, "RemotePickup").length;
    const needed = sourceCount - currentTaskCount;

    const originRoom = Game.rooms[roomMem.baseRoomName];
    const storage = originRoom.storage;
    var links = global.roomManager.links(roomMem.baseRoomName).filter(l => l.pos.findInRange(FIND_EXIT, 3).length > 0)
    //console.log(links.length);
    if (links.length > 1) {
      //console.log("found some!")
      links = _.filter(links, l => l.linkMode === "SEND" && l.pos.getRangeTo(new RoomPosition(25, 25, roomName)))
      //console.log(JSON.stringify(links, null, 2));
    }
    if (storage == undefined && links.length == 0) {
      return;
    }
    var dropOffID = links.length == 0 ? (<StructureStorage>storage).id : links[0].id;

    for (var i = 0; i < needed; i++) {
      const request = new RemotePickupRequest(roomMem.baseRoomName, roomName, dropOffID);
      CreepTaskQueue.addPendingRequest(request)
    }

  }
}
