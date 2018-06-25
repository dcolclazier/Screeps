import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "tasks/CreepTaskQueue";
import * as utils from "utils/utils"
import { CreepRole } from "utils/utils";
import { CreepMemory, RoomMemory } from "utils/memory";
import { TaskStatus, Task } from "tasks/Task";

export class FillContainersRequest extends CreepTaskRequest {
  name: string = "FillContainers";
  priority: number = 2;
  requiredRole: utils.CreepRole = CreepRole.ROLE_WORKER;
  maxConcurrent: number = 3;
  constructor(roomName: string, restockID: string) {
    super(roomName, `💰2`, restockID);
  }

}

export class FillContainers extends CreepTask {

  protected init(): void {
    super.init();

    //var fillStorage = this.request as FillContainersRequest;

    //console.log("status after init" + Task.getStatus(this.request.status))
    this.request.status = TaskStatus.PREPARE;
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == TaskStatus.FINISHED) return;
    //const restockInfo = this.request as FillStorageRequest;
    var room = Game.rooms[this.request.roomName];
    var roomMem = room.memory as RoomMemory;
    //this.collectFromContainer(this.request.roomName, creep.id);

    //temp code...
    if (this.creep.carry.energy == 0) {
      if (this.collectFromContainer(room.name)) return;
      if (this.collectFromDroppedEnergy(room.name)) return;
      if (this.collectFromTombstone(room.name)) return;
      //this.collectFromSource(room.name);

    }
    else {
      this.request.status = TaskStatus.IN_PROGRESS;
    }
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == TaskStatus.FINISHED) return;
    //const creep = Game.creeps[this.request.assignedTo];
    var room = Game.rooms[this.request.roomName];
    var roomMem = room.memory as RoomMemory;
    let storages = room.find(FIND_STRUCTURES).filter(s => {
      if (s.structureType == "container" && s.store.energy < s.storeCapacity) {
        var smartContainer = roomMem.containers[s.id];
        return smartContainer.shouldFill;
      }
      return false;
    }) as StructureContainer[];
    if (storages.length == 0) {
      this.request.status = TaskStatus.FINISHED;
      return;
    }

    const closest = _.first(_.sortBy(storages, s => this.creep.pos.getRangeTo(s)))
    
    const result = this.creep.transfer(closest, RESOURCE_ENERGY)
    if (result == ERR_NOT_IN_RANGE) {
      this.creep.moveTo(closest, { visualizePathStyle: { stroke: '#ffffff' } });
    }
    else {
      this.request.status = TaskStatus.FINISHED;
    }
    //else if (result == OK) {
    //  this.request.status = TaskStatus.FINISHED;
    //}
    //else {
    //  this.request.status = TaskStatus.FINISHED;
    //}
  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

  static addRequests(roomName: string) {

    const room = Game.rooms[roomName];
    const roomMem = room.memory as RoomMemory;
    //let storages = room.find(FIND_MY_STRUCTURES).filter(s => s.structureType == "storage") as StructureStorage[];
    let containers = room.find(FIND_STRUCTURES).filter(s => {
      if (s.structureType == "container" && s.store.energy < s.storeCapacity) {
        var smartContainer = roomMem.containers[s.id];
        return smartContainer.shouldFill;
      }
      return false;
    }) as StructureContainer[];
    if (containers.length == 0) return;
    //let workers = utils.creepNamesByRole(roomName, CreepRole.ROLE_WORKER).filter(name => {
    //  const worker = Game.creeps[name] as Creep;
    //  return worker.carry.energy > 0;
    //})
    //if (workers.length == 0) return;
    var reqTemplate = new FillContainersRequest(roomName, "")
    let existingTaskCount = CreepTaskQueue.totalCount(roomName, reqTemplate.name);
    let maxConcurrentCount = reqTemplate.maxConcurrent;

    for (var i = existingTaskCount; i < maxConcurrentCount;) {
      _.each(containers, c => {
        CreepTaskQueue.addPendingRequest(new FillContainersRequest(roomName, c.id))
        i++;
      });
    }


    for (const targetID in containers) {
      let restockable = containers[targetID];

      let request = new FillContainersRequest(roomName, restockable.id);
     

      if (existingTaskCount < maxConcurrentCount) {
        CreepTaskQueue.addPendingRequest(request)
      }
    }
  }
}


export class FillStorageRequest extends CreepTaskRequest {
  priority: number = 3;
  name = "FillStorage";
  requiredRole = CreepRole.ROLE_WORKER
  maxConcurrent = 2;
  constructor(roomName: string, restockID: string) {
    super(roomName, `💰`, restockID);
  }
}

export class FillStorage extends CreepTask {

  sources: Source[] = []
  protected init(): void {
    super.init();

    var fillStorage = this.request as FillStorageRequest;

    //console.log("status after init" + Task.getStatus(this.request.status))
    this.request.status = TaskStatus.PREPARE;
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == TaskStatus.FINISHED) return;
    const restockInfo = this.request as FillStorageRequest;
    var room = Game.rooms[this.request.roomName];
    var roomMem = room.memory as RoomMemory;
    //this.collectFromContainer(this.request.roomName, creep.id);

    //temp code...
    if (this.creep.carry.energy == 0) {
      if (this.collectFromContainer(room.name)) return;
      if(this.collectFromDroppedEnergy(room.name)) return;
      if(this.collectFromTombstone(room.name)) return;
      //this.collectFromSource(room.name);

    }
    else {
      this.request.status = TaskStatus.IN_PROGRESS;
    }
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == TaskStatus.FINISHED) return;
    const creep = Game.creeps[this.request.assignedTo];

    let storages = creep.room.find(FIND_MY_STRUCTURES).filter(s => s.structureType == "storage") as StructureStorage[]
    const sortedByRange = _.sortBy(storages, s => this.creep.pos.getRangeTo(s));
    console.log("sorted ranges: " + JSON.stringify(sortedByRange))
    
    if (sortedByRange.length == 0) {
      this.request.status = TaskStatus.FINISHED;
    }
    else {
      const result = creep.transfer(sortedByRange[0], RESOURCE_ENERGY)
      const target = sortedByRange[0]
      if (result == ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      else if (result == OK) {
        this.request.status = TaskStatus.FINISHED;
      }
      else {
        this.request.status = TaskStatus.FINISHED;
      }
    }
  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

  static addRequests(roomName: string) {

    const room = Game.rooms[roomName];
    let storages = room.find(FIND_MY_STRUCTURES).filter(s => s.structureType == "storage") as StructureStorage[];
    //let workers = utils.creepNamesByRole(roomName, CreepRole.ROLE_WORKER).filter(name => {
    //  const worker = Game.creeps[name] as Creep;
    //  return worker.carry.energy > 0;
    //})
    //if (workers.length == 0) return;

    for (const targetID in storages) {
      let restockable = storages[targetID];
      if (restockable.store.energy == restockable.storeCapacity) continue;
      let request = new FillStorageRequest(roomName, restockable.id);
      let existingTaskCount = CreepTaskQueue.totalCount(roomName, request.name);
      let maxConcurrentCount = request.maxConcurrent;

      if (existingTaskCount < maxConcurrentCount) {
        CreepTaskQueue.addPendingRequest(request)
      }
    }
  }
}
