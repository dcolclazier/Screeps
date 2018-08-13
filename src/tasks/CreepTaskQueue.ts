import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import * as utils from "utils/utils"

export class CreepTaskQueue {
  static removeFinished(): void {
    const finished = _.filter(Memory.creepTasks, req => req.status == "FINISHED");
    for (var id in finished) {
      this.removeTask(id)
    }
  }

  static addPendingRequest(request: CreepTaskRequest): void {
    if (request == undefined) {
      console.log("In CreepTaskQueue.addPendingRequest, request was undefined");
      return;
    }
    if (Memory.creepTasks == undefined) {
      console.log("In CreepTaskQueue.addPendingRequest, creepTasks was undefined");
      return;
    }
    Memory.creepTasks[request.id] = request;
    //console.log("task added.")
    //console.log(Object.keys(Memory.creepTasks).length)
  }
  static count(roomName: string, taskName: string = "", targetID: string = "", status: TaskStatus = "ANY", creepRole: CreepRole = "ROLE_ALL"): number {
    return CreepTaskQueue.getTasks(roomName, taskName, targetID, status, creepRole).length;
  }
  static getTasks(roomName: string, taskName: string = "", targetID:string = "",  status: TaskStatus = "ANY", creepRole: CreepRole = "ROLE_ALL"): string[]{

    var matchingRequests = _.filter(Memory.creepTasks, req =>
      req.originatingRoomName == roomName &&
      (taskName == "" || req.name == taskName) &&
      (targetID == "" || targetID == req.targetID) &&
      (status == "ANY" || req.status == status) &&
      (creepRole == "ROLE_ALL" || _.includes(req.validRoles, creepRole)));

    return _.map(matchingRequests, request => request.id);
  }

  static activeTasks(roomName: string, taskName: string = "", targetID: string = "") {
    return _.filter(Memory.creepTasks, task =>
      task.originatingRoomName == roomName &&
      task.status != "PENDING" &&
      task.status != "FINISHED" &&
      task.name == taskName || taskName == "" &&
      targetID == task.targetID || targetID == "");
  }

  static removeTask(id: string): void {
    //console.log("Deleting task")
    var task = Memory.creepTasks[id];
    var creep = <Creep>Game.getObjectById(task.assignedToID)
    if (creep != undefined && creep.memory.currentTask == id) {
      creep.memory.idle = true;
      creep.memory.currentTask = ""
    }

    delete Memory.creepTasks[id];
  }
  static getTask(id: string): CreepTaskRequest | undefined {

    var request = Memory.creepTasks[id];
    if (request == undefined) {
      console.log("ERROR: Invalid Task ID (CreepTaskQueue.getTask)");
    }
    return request;
  }
  static assignRequest(creepName: string, originatingRoomName: string): void {

    const creep = Game.creeps[creepName];
    if (creep == undefined) {
      console.log("ERROR: assignPendingRequest -> creep cannot be undefined!");
      return;
    }
    if (creep.spawning) return;
    if (creep == undefined) return;

    //console.log("Assiging task to " + creepName);

    var nextTaskID = CreepTaskQueue.getNextTaskID(creepName, originatingRoomName);
    if (nextTaskID == "") return;

    //console.log(JSON.stringify(Memory.creepTasks[nextTaskID]))
    //console.log("Next task ID: " + nextTaskID)

    var nextTask = Memory.creepTasks[nextTaskID];
    if (nextTask == undefined) {
      console.log("ERROR: assignPendingRequest -> nextTask cannot be undefined!");
      return;
    }

    creep.memory.idle = false;
    creep.memory.currentTask = nextTask.id;
    nextTask.assignedToID = creep.id;
    nextTask.status = "INIT";
  }
  private static getNextTaskID(creepName: string, originatingRoomName: string): string {

    const creep = Game.creeps[creepName];
    const tasks = CreepTaskQueue.getTasks(originatingRoomName, "", "", "PENDING", creep.memory.role);
    if (tasks.length == 0) return "";

    const sortedByPriority = _.sortByAll(_.map(tasks, id => Memory.creepTasks[id]),
      [
        'priority',
        t => creep.pos.getRangeTo(<HasPos>Game.getObjectById(t.targetID))
      ]);
    //console.log(JSON.stringify(sortedByPriority));
    if (sortedByPriority.length == 0) return "";

    return sortedByPriority[0].id;
  }
}


//export class CreepTaskQueue {

//  static addPendingRequest(request: CreepTaskRequest): any {

//    var totalCurrent = CreepTaskQueue.totalCount(request.requestingRoomName, request.name);
//    if (totalCurrent < request.maxConcurrent) {
//      let roomMem = Game.rooms[request.requestingRoomName].memory as RoomMemory;
//      roomMem.pendingWorkerRequests.push(request);
//    }

//  }
//  static startPendingRequest(creepName: string, roomName: string): void {
//    let roomMem = Game.rooms[roomName].memory as RoomMemory;
//    if (roomMem.pendingWorkerRequests.length == 0) return;

//    const creep = Game.creeps[creepName] as Creep;
//    const mem = creep.memory as CreepMemory;

//    const validTasks = roomMem.pendingWorkerRequests.filter(r => _.includes(r.validRoles, mem.role));
//    if (validTasks.length == 0) return;
//    //console.log("valid: " + mem.role + " , " + validTasks[0].validRoles)
      
//    const sortedValidTasks = _.sortByAll(validTasks, ['priority', t => creep.pos.getRangeTo(Game.getObjectById(validTasks[0].targetID) as AnyStructure | Creep | RoomObject)]);

//    //let debug: string = ""
//    //for (const key in sortedValidTasks) {
//    //  let task = sortedValidTasks[key];
//    //  if (task != undefined) debug += task.priority + ", "
//    //}
//    //console.log("Debug: " + debug);

//    for (const key in sortedValidTasks)
//    {
//      if (sortedValidTasks.hasOwnProperty(key))
//      {
//        const task = sortedValidTasks[key];
//        var nextTask = _.find(roomMem.pendingWorkerRequests, task)

//        if (nextTask != undefined)
//        {
//          nextTask.assignedTo = creepName;
//          mem.idle = false;
//          mem.currentTask = nextTask.name;
          
//          roomMem.activeWorkerRequests[creepName] = nextTask;
//          _.remove(roomMem.pendingWorkerRequests, nextTask);

//          //console.log(JSON.stringify(nextTask))

//          nextTask.status = "INIT";
//          break;
//        }
//        else {
//          //console.log("ARGH!!!.")
//        }
//      }
//    }

//  }
  
//  static allActive(roomName: string): { [index: string]: CreepTaskRequest } {
//    let roomMem = Game.rooms[roomName].memory as RoomMemory;
//    return roomMem.activeWorkerRequests as { [index: string]: CreepTaskRequest };
//  }
//  static getActiveRequest(roomName: string, creepName: string): CreepTaskRequest | undefined {
//    let roomMem = Game.rooms[roomName].memory as RoomMemory;
//    var request = roomMem.activeWorkerRequests[creepName];
//    return request;
//  }
//  //}
//  //static getPendingRequest(roomName: string, creepName: string): CreepTaskRequest | undefined {
//  //  let roomMem = Game.rooms[roomName].memory as RoomMemory;
//  //  var request = roomMem.activeWorkerRequests[creepName];
//  //  return request;
//  //}
//  static totalCount(roomName: string, taskName: string = "") {
//    return CreepTaskQueue.activeCount(roomName, taskName)
//      + CreepTaskQueue.pendingCount(roomName, taskName)
//  }
//  static pendingCount(roomName: string, taskName: string = ""): number {
//    let roomMem = Game.rooms[roomName].memory as RoomMemory;

//    if (taskName == "") {
//      return roomMem.pendingWorkerRequests.length;
//    }
//    else {

//      let count = 0;
//      const tasks = roomMem.pendingWorkerRequests;
//      for (const id in tasks) {
//        const task = tasks[id];
//        if (task.name == taskName) count++;
//      }
//      return count;
//    }
//  }
//  static activeCountAllRooms(taskName: string): number {

//    var count: number = 0;
//    for (var i in Game.rooms) {
//      var room = Game.rooms[i];
//      if (room == undefined) continue;
//      count += this.activeCount(room.name, taskName);
//    }
//    return count;
//  }
//  static pendingCountAllRooms(taskName: string): number {

//    var count: number = 0;
//    for (var i in Game.rooms) {
//      var room = Game.rooms[i];
//      if (room == undefined) continue;
//      count += this.pendingCount(room.name, taskName);
//    }
//    return count;
//  }
//  static activeCount(roomName: string, taskName: string = ""): number {

//    let roomMem = Game.rooms[roomName].memory as RoomMemory;
//    var count: number = 0;
//    for (var i in roomMem.activeWorkerRequests) {
//      var request = roomMem.activeWorkerRequests[i];
//      if (request.name == taskName || taskName == "")
//        count++;

//    }
//    return count;
//    //return Object.keys(roomMem.activeWorkerRequests).length;

//  }
//  static active(roomName: string, taskName: string = "", targetID: string = ""): CreepTaskRequest[] {

//    let room = Game.rooms[roomName];
//    if (room == undefined) return [];

//    let roomMem = room.memory as RoomMemory;
//    var requests: CreepTaskRequest[] = [];
//    for (var i in roomMem.activeWorkerRequests) {
//      var request = roomMem.activeWorkerRequests[i];
//      if (taskName != "" && request.name != taskName) continue;
//      if (targetID != "" && request.targetID != targetID) continue;
//      requests.push(request);
//    }
//    return requests;

//  }
//  static pending(roomName: string, taskName: string = "", targetID: string = ""): CreepTaskRequest[] {

//    let room = Game.rooms[roomName];
//    if (room == undefined) return [];

//    let roomMem = room.memory as RoomMemory;
//    var requests: CreepTaskRequest[] = [];
//    for (var i in roomMem.pendingWorkerRequests) {
//      var request = roomMem.pendingWorkerRequests[i];
//      if (taskName != "" && request.name != taskName) continue;
//      if (targetID != "" && request.targetID != targetID) continue;
//      requests.push(request);
//    }
//    return requests;
//    //return Object.keys(roomMem.activeWorkerRequests).length;

//  }
//}
