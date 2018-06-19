import { CreepMemory, StructureMemory, SmartStructure } from "utils/memory"
import * as utils from "utils/utils";
//import { Restock } from "tasks/creep/Restock";
//import { Build } from "tasks/creep/Build";
//import { Upgrade } from "tasks/creep/Upgrade";
import { CreepTaskQueue } from "tasks/CreepTaskQueue";
//import { StructureTaskQueue } from "tasks/StructureTaskQueue";
import { ITask } from "contract/ITask";
// import { RepairTask } from "tasks/creep/Repair";
//import { FillTower } from "tasks/creep/FillTower";
//import { TowerRepair } from "tasks/structure/TowerRepair";
//import { TowerAttack } from "tasks/structure/TowerAttack";
import { Mine } from "tasks/creep/Mine";
//import { TransferEnergy } from "tasks/creep/TransferEnergy";
//import { PickupEnergy } from "tasks/creep/PickupEnergy";
import { CreepRole } from "utils/utils";
//import { StructureTask } from "tasks/StructureTask";
//import { StructureTaskRequest } from "tasks/StructureTaskRequest";
import { TaskStatus } from "tasks/Task";
import { RoomMemory } from "utils/memory"

export class TaskManager {
  static continueActiveRequests(roomName: string) {

    const activeWorkerTasks = CreepTaskQueue.allActive(roomName);
    console.log(Object.keys(activeWorkerTasks).length);


    _.each(activeWorkerTasks, request => {

      var roomMem = Game.rooms[roomName].memory as RoomMemory;
      if (request.name == "Mine") {
        console.log("once")
        var task = new Mine(request);
        task.run();
        if (task.request.status == TaskStatus.FINISHED) {
          console.log("deleting!")
          delete roomMem.activeWorkerRequests[request.assignedTo];
        }
      }
      else { console.log(request.name)}


      //if (Game.creeps[request.assignedTo] == undefined) request.status = TaskStatus.FINISHED;
      //if (request.status == TaskStatus.FINISHED) {
      //  delete activeWorkerTasks[assignedName];
      //  return;
      //}
    })
    for (const assignedName in activeWorkerTasks) {
      //if (taskInfo.name == "Restock") (new Restock(taskInfo)).run();
      //else if (taskInfo.name == "Upgrade") (new Upgrade(taskInfo)).run();
      //else if (taskInfo.name == "Build") (new Build(taskInfo)).run();
      //else if (taskInfo.name == "Repair") (new RepairTask(taskInfo), roomName).run()
      //else if (taskInfo.name == "FillTower") (new FillTower(taskInfo)).run();
      //else if (taskInfo.name == "TransferEnergy") (new TransferEnergy(taskInfo)).run();
      //else if (taskInfo.name == "PickupEnergy") (new PickupEnergy(taskInfo)).run()
    }

    //let activeStructureTasks = StructureTaskQueue.allActive(roomName);
    //for (let buildingID in activeStructureTasks)
    //{
    //	let structureTaskInfo = activeStructureTasks[buildingID];
    //	if (structureTaskInfo.assignedTo != buildingID) structureTaskInfo.assignedTo = buildingID;

    //	if (structureTaskInfo.name == "TowerRepair") (new TowerRepair(structureTaskInfo)).run();
    //	if (structureTaskInfo.name == "TowerAttack") (new TowerAttack(structureTaskInfo)).run();
    //}
  }
  private static addBuildingTasks(roomName: string) {
    //TowerAttack.addTask(roomName);
    //TowerRepair.addTask(roomName);
    //console.log("finished building tasks")
  }
  private static addPendingRequests(roomName: string): void {
    //PickupEnergy.addRequests(roomName);
    //Restock.addRequests(roomName);
    Mine.addRequests(roomName);
    //TransferEnergy.addRequests(roomName);
    //FillTower.addRequests(roomName);
    //Build.addRequests(roomName);
    //Upgrade.addRequests(roomName);
  }
  static Run(roomName: string): void {
    //this.addBuildingTasks(roomName);
    this.continueActiveRequests(roomName);

    this.addPendingRequests(roomName);
    this.assignPendingRequests(roomName);
  }


  private static assignPendingRequests(roomName: string) {
    //console.log("assignPendingTasks");
    let idleCreeps = utils.findIdleCreeps(roomName);
    for (let id in idleCreeps) {
      let creep = idleCreeps[id] as Creep;
      if (creep != undefined) {
        let mem = creep.memory as CreepMemory;
        if (mem.role == CreepRole.ROLE_MINER) {
          console.log("found a miner: " + creep.name);
          console.log("idle: " + mem.idle);
        }

        if (mem.idle) {
          CreepTaskQueue.start(creep.name, roomName)
        }
      }
    }

    //let idleStructures = utils.findIdleSmartStructures(roomName);
    //for (let id in idleStructures) {
    //  let structure = idleStructures[id] as SmartStructure;
    //  if (structure != undefined) {
    //    let memory = structure.memory as StructureMemory;
    //    if (memory.idle) {
    //      StructureTaskQueue.startTask(structure.id, roomName);
    //    }
    //  }
    //}

    // let stillIdleCreeps = utils.findIdleCreeps(roomName);
    // for (let id in stillIdleCreeps)
    // {
    // 	let creep = stillIdleCreeps[id];
    // 	let m = creep.memory as CreepMemory
    // 	creep.moveTo(Game.getObjectById(m.spawnID) as StructureSpawn)
    // }
  }

  // private static processExistingRequest(task: ITask)
  // {
  // 	console.log("processing")
  // 	task.run();
  // 	// if (task.request.status == TaskState.FINISHED)
  // 	// {
  // 	// 	console.log("Finishing task " + task.request.name);

  // 	// }
  // 	// if (!task.request.started)
  // 	// {
  // 	// 	console.log("start")
  // 	// 	task.start();
  // 	// }
  // 	// if (task.request.finished)
  // 	// {
  // 	// 	console.log("Finishing task " + task.request.name);
  // 	// 	CreepTaskQueue.finish(task.request.assignedTo, roomName);
  // 	// }
  // 	// else if (task.request.started)
  // 	// {
  // 	// 	task.continue();
  // 	// }

  // }

}
