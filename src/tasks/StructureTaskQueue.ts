import { StructureTaskRequest } from "tasks/StructureTaskRequest";

export class StructureTaskQueue {
  static totalCount(roomName: string, taskName: string = "") {
    return StructureTaskQueue.activeCount(roomName, taskName)
      + StructureTaskQueue.pendingCount(roomName, taskName);
  }
  static pendingCount(roomName: string, taskName: string = ""): number {
    let roomMem = Game.rooms[roomName].memory as RoomMemory;
    if (taskName == "") {
      return roomMem.pendingStructureRequests.length;
    }
    else {
      let count = 0;
      let tasks = roomMem.pendingStructureRequests;
      for (const id in tasks) {
        let task = tasks[id];
        if (task.name == taskName)
          count++;
      }
      return count;
    }
  }
  static activeCount(roomName: string, taskName: string = ""): number {


    let roomMem = Game.rooms[roomName].memory as RoomMemory;
    var count: number = 0;
    for (var i in roomMem.activeStructureRequests) {
      var request = roomMem.activeStructureRequests[i];
      if (request.name == taskName || taskName == "")
        count++;

    }
    return count;

    //let roomMem = Game.rooms[roomName].memory as RoomMemory;
    //if (taskName == "") {
    //  return roomMem.activeStructureRequestCount;
    //}
    //else {
    //  let count = 0;
    //  let tasks = roomMem.activeStructureRequests;
    //  for (let task in tasks) {
    //    let test = tasks[task];
    //    if (test.name == taskName)
    //      count++;
    //  }
    //  return count;
    //}
  }
  static addPendingRequest(request: StructureTaskRequest): void {
    //console.log("addpending")
    let roomMem = Game.rooms[request.requestingRoomName].memory as RoomMemory;
    var totalCurrent = StructureTaskQueue.totalCount(request.requestingRoomName, request.name);
    //console.log("total current pending tasks: "+ request.name + " "+ totalCurrent)
    //console.log("when adding: "+ request.targetID)
    if (totalCurrent < request.maxConcurrent) {
      let roomMem = Game.rooms[request.requestingRoomName].memory as RoomMemory;
      roomMem.pendingStructureRequests.push(request);
    }

  }
  static startTask(buildingID: string, roomName: string): void {
    let roomMem = Game.rooms[roomName].memory as RoomMemory;
    if (roomMem.pendingStructureRequests.length == 0) {
      //console.log("no pending requests.")
      return;
    }
    const sortedTasks = _.sortBy(roomMem.pendingStructureRequests, s => s.priority);
    //console.log("sorted priority: " + JSON.stringify(sortedTasks.map(t => t.priority)))
    for (const key in sortedTasks) {
      if (sortedTasks.hasOwnProperty(key)) {
        const task = sortedTasks[key];
        var nextTask = _.find(roomMem.pendingStructureRequests, task)

        if (nextTask != undefined) {
          nextTask.assignedTo = buildingID;
          //mem.idle = false;
          //mem.currentTask = nextTask.name;

          roomMem.activeStructureRequests[buildingID] = nextTask;
          _.remove(roomMem.pendingStructureRequests, nextTask);

          //console.log(JSON.stringify(nextTask))

          nextTask.status = "INIT";
          break;
        }
        else {
          //console.log("ARGH!!!.")
        }
      }
    }
    //let nextTask = roomMem.pendingStructureRequests.shift();
    //if (nextTask != undefined) {
    //  console.log(JSON.stringify(nextTask))
    //  nextTask.assignedTo = buildingID;
    //  roomMem.activeStructureRequests[buildingID] = nextTask;
    //  nextTask.status = "INIT";
    //}
  }
  //static finish(creepName: string, roomName: string) {
  //  let roomMem = Game.rooms[roomName].memory as RoomMemory;
  //  delete roomMem.activeStructureRequests[creepName];
  //  roomMem.activeStructureRequestCount--;
  //}
  static allActive(roomName: string): { [index: string]: StructureTaskRequest; } {
    let roomMem = Game.rooms[roomName].memory as RoomMemory;
    return roomMem.activeStructureRequests as { [index: string]: StructureTaskRequest; };
  }
}
