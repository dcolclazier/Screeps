import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "tasks/CreepTaskQueue";
import * as utils from "utils/utils"
import { roomManager } from "RoomManager";


export class FillStorageRequest extends CreepTaskRequest {
  priority: number = 4;
  name = "FillStorage";
  validRoles : CreepRole[] = ["ROLE_CARRIER"]
  maxConcurrent = 1;
  constructor(roomName: string, storageID: string) {
    super(roomName, roomName, storageID, `💰`);
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
    var roomMem = room.memory as RoomMemory;

    if (this.creep.carry.energy == 0) {
      
      if(this.collectFromDroppedEnergy(room.name)) return;
      if (this.collectFromTombstone(room.name)) return;
      if (this.collectFromMasterLink(room.name)) return;
      if (this.collectFromContainer(room.name)) return;
      //this.collectFromSource(room.name);
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
    let storages = room.find(FIND_MY_STRUCTURES).filter(s => s.structureType == "storage") as StructureStorage[];

    const storage = room.storage;
    if (storage == undefined) return;

    let request = new FillStorageRequest(roomName, storage.id);
    let existingTaskCount = CreepTaskQueue.count(roomName, request.name);
    let maxConcurrentCount = request.maxConcurrent;

    if (existingTaskCount < maxConcurrentCount) {
      CreepTaskQueue.addPendingRequest(request)
    }
    
  }
}
