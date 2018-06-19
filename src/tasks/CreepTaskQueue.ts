import { RoomMemory, CreepMemory } from "utils/memory"
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import * as utils from "utils/utils"
import { TaskStatus } from "./Task";

export class CreepTaskQueue {

  static totalCount(roomName: string, taskName: string = "") {
    return CreepTaskQueue.activeCount(roomName, taskName)
      + CreepTaskQueue.pendingCount(roomName, taskName)
  }
  static pendingCount(roomName: string, taskName: string = ""): number {
    let roomMem = Game.rooms[roomName].memory as RoomMemory;

    if (taskName == "") {
      return roomMem.pendingWorkerRequests.length;
    }
    else {

      let count = 0;
      const tasks = roomMem.pendingWorkerRequests;
      for (const id in tasks) {
        const task = tasks[id];
        if (task.name == taskName) count++;
      }
      return count;
    }
  }
  static activeCount(roomName: string, taskName: string = ""): number {

    let roomMem = Game.rooms[roomName].memory as RoomMemory;
    return Object.keys(roomMem.activeWorkerRequests).length;
    
  }

  static addPending(request: CreepTaskRequest): any {
    if (CreepTaskQueue.totalCount(request.roomName, request.name) < request.maxConcurrent) {
      let roomMem = Game.rooms[request.roomName].memory as RoomMemory;
      roomMem.pendingWorkerRequests.push(request);
    }


  }
  static start(creepName: string, roomName: string): void {
    let roomMem = Game.rooms[roomName].memory as RoomMemory;
    if (roomMem.pendingWorkerRequests.length == 0) return;

    let creep = Game.creeps[creepName] as Creep;
    let mem = creep.memory as CreepMemory;
    let validTasks = roomMem.pendingWorkerRequests.filter(r => r.requiredRole == mem.role);
    if (validTasks.length == 0) {
      console.log("nothing to assign for " + creepName + " for role " + utils.getRoleString(mem.role))
      return;
    }
    let sorted = _.sortByAll(validTasks, ['priority', t => creep.pos.getRangeTo(Game.getObjectById(validTasks[0].targetID) as AnyStructure | Creep | RoomObject)]);


    let debug: string = ""
    for (const key in sorted) {
      let task = sorted[key];
      if (task != undefined) debug += task.priority + ", "
    }
    //console.log("Debug: " + debug);

    for (const key in sorted)
    {
      if (sorted.hasOwnProperty(key))
      {
        const task = sorted[key];
        var nextTask = _.find(roomMem.pendingWorkerRequests, task)

        if (nextTask != undefined)
        {
          nextTask.assignedTo = creepName;
          mem.idle = false;
          mem.currentTask = nextTask.name;
          
          roomMem.activeWorkerRequests[creepName] = nextTask;
          _.remove(roomMem.pendingWorkerRequests, nextTask);

          console.log(JSON.stringify(nextTask))

          nextTask.status = TaskStatus.INIT;
          break;
        }
        else {
          console.log("ARGH!!!.")
        }
      }
    }

  }
  // static finish(creepName: string, roomName: string)
  // {

  // 	let roomMem = Game.rooms[roomName].memory as RoomMemory;
  // 	//let started = roomMem.activeWorkerRequests[creepName].started;
  // 	//if(started) roomMem.activeWorkerTaskCount--;
  // 	delete roomMem.activeWorkerRequests[creepName];

  // }
  static allActive(roomName: string): { [index: string]: CreepTaskRequest } {
    let roomMem = Game.rooms[roomName].memory as RoomMemory;
    return roomMem.activeWorkerRequests as { [index: string]: CreepTaskRequest };
  }

  static count(roomName: string): any {

  }
}
