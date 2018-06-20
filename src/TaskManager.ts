import { CreepMemory, StructureMemory, SmartStructure } from "utils/memory"
import * as utils from "utils/utils";
//import { Upgrade } from "tasks/creep/Upgrade";
import { CreepTaskQueue } from "tasks/CreepTaskQueue";
import { StructureTaskQueue } from "tasks/StructureTaskQueue";
import { ITask } from "contract/ITask";
//import { TowerRepair } from "tasks/structure/TowerRepair";
//import { TowerAttack } from "tasks/structure/TowerAttack";
import { Mine } from "tasks/creep/Mine";
//import { TransferEnergy } from "tasks/creep/TransferEnergy";
import { CreepRole } from "utils/utils";
import { StructureTask } from "tasks/StructureTask";
import { StructureTaskRequest } from "tasks/StructureTaskRequest";
import { TaskStatus, Task } from "tasks/Task";
import { RoomMemory } from "utils/memory"
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { PickupEnergy } from "tasks/creep/PickupEnergy";
import { ITaskRequest } from "contract/ITaskRequest";
import { Restock } from "tasks/creep/Restock";
import { Build } from "tasks/creep/Build";
import { Upgrade } from "tasks/creep/Upgrade";
import { FillTower } from "tasks/creep/FillTower";
import { TowerAttack } from "tasks/structure/TowerAttack";
import { TowerRepair } from "tasks/structure/TowerRepair";

export class TaskManager {

  private static runTask(task: Task) {

    if (task.request.status == TaskStatus.FINISHED)
    {
      if (task.request.isCreepTask) TaskManager.removeWorkerTasks(task.request);
      else TaskManager.removeStructureTasks(task.request);
      return;
    }
    
    task.run();
  }
  private static removeWorkerTasks(request: ITaskRequest): void {

    const roomMem = Game.rooms[request.roomName].memory as RoomMemory;
    delete roomMem.activeWorkerRequests[request.assignedTo];
  }
  private static removeStructureTasks(request: ITaskRequest): void {

    //console.log("removing structure task: " + request.name)
    const roomMem = Game.rooms[request.roomName].memory as RoomMemory;
    delete roomMem.activeStructureRequests[request.assignedTo];
  }
  static continueActiveRequests(roomName: string) {

    const activeWorkerTasks = CreepTaskQueue.allActive(roomName);
    //console.log(Object.keys(activeWorkerTasks).length);

    _.each(activeWorkerTasks, request => {

      if (Game.creeps[request.assignedTo] === undefined) {
        request.status == TaskStatus.FINISHED;
      }
           
      if (request.name == "Mine") TaskManager.runTask(new Mine(request));
      else if (request.name == "PickupEnergy") TaskManager.runTask(new PickupEnergy(request))
      else if (request.name == "Restock") TaskManager.runTask(new Restock(request));
      else if (request.name == "Upgrade") TaskManager.runTask(new Upgrade(request))
      else if (request.name == "Build") TaskManager.runTask(new Build(request));
      else if (request.name == "FillTower") TaskManager.runTask(new FillTower(request))
      else { console.log("Reqiest" + request.name)}

    })
    //for (const assignedName in activeWorkerTasks) {
    //  //else if (taskInfo.name == "TransferEnergy") (new TransferEnergy(taskInfo)).run();
      
    //}
    let activeStructureTasks = StructureTaskQueue.allActive(roomName);
    _.each(activeStructureTasks, request => {
      if (Game.getObjectById(request.assignedTo) as AnyOwnedStructure === undefined) {
        console.log("here.")
        request.status == TaskStatus.FINISHED;
      }
      
      if (request.name == "TowerRepair") (new TowerRepair(request)).run();
      if (request.name == "TowerAttack") (new TowerAttack(request)).run();
    })
    
    //for (let buildingID in activeStructureTasks)
    //{
      
    //	let request = activeStructureTasks[buildingID];
    //	if (request.assignedTo != buildingID) request.assignedTo = buildingID;

    	
    //}
    //console.log("finished continueActiveRequests")
  }
  private static addBuildingTasks(roomName: string) {
    //console.log("add attack")
    
    TowerAttack.addTask(roomName);
    //console.log("add repair")
    TowerRepair.addTask(roomName);
    //console.log("finished building tasks")
  }
  private static addPendingRequests(roomName: string, energyLevel: number): void {

    //PickupEnergy.addRequests(roomName);
    Restock.addRequests(roomName);
    Mine.addRequests(roomName, energyLevel);
    //TransferEnergy.addRequests(roomName);
    FillTower.addRequests(roomName);
    Build.addRequests(roomName);
    Upgrade.addRequests(roomName, 6);
    //console.log("finished adding pending worker requests");
  }
  static Run(roomName: string, energyLevel: number): void {

    this.addBuildingTasks(roomName);
    this.continueActiveRequests(roomName);

    this.addPendingRequests(roomName, energyLevel);
    this.assignPendingRequests(roomName);
  }


  private static assignPendingRequests(roomName: string) {
    let idleCreeps = utils.findIdleCreeps(roomName);
   
    for (let id in idleCreeps) {
      let creep = idleCreeps[id] as Creep;
      if (creep != undefined) {
        let mem = creep.memory as CreepMemory;
        //if (mem.role == CreepRole.ROLE_MINER) {
        //  console.log("found a miner: " + creep.name);
        //  console.log("idle: " + mem.idle);
        //}

        if (mem.idle) {
          CreepTaskQueue.startPendingRequest(creep.name, roomName)
        }
      }
    }

    let idleStructures = utils.findIdleSmartStructures(roomName);
    for (let id in idleStructures) {
      let structure = idleStructures[id] as SmartStructure;
      if (structure != undefined) {
        let memory = structure.memory as StructureMemory;
        if (memory.idle) {
          StructureTaskQueue.startTask(structure.id, roomName);
        }
      }
    }
    //console.log("finished assigning pending")
    // let stillIdleCreeps = utils.findIdleCreeps(roomName);
    // for (let id in stillIdleCreeps)
    // {
    // 	let creep = stillIdleCreeps[id];
    // 	let m = creep.memory as CreepMemory
    // 	creep.moveTo(Game.getObjectById(m.spawnID) as StructureSpawn)
    // }
  }

}
