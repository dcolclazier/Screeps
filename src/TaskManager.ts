//import { SmartLink } from "utils/memory"
import * as utils from "utils/utils";
import { CreepTaskQueue } from "tasks/CreepTaskQueue";
import { StructureTaskQueue } from "tasks/StructureTaskQueue";
import { Mine } from "tasks/creep/Mine";
import { StructureTask } from "tasks/StructureTask";
//import { StructureTaskRequest } from "tasks/StructureTaskRequest";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { PickupEnergy } from "tasks/creep/PickupEnergy";
import { Restock } from "tasks/creep/Restock";
import { Build, Dismantle } from "tasks/creep/Build";
import { Upgrade, Defend } from "tasks/creep/Upgrade";
import { FillTower } from "tasks/creep/FillTower";
import { TowerAttack } from "tasks/structure/TowerAttack";
import { TowerRepair } from "tasks/structure/TowerRepair";
import { FillStorage } from "FillStorage";
import { FillContainers } from "FillContainers";
import { RemoteUpgrade } from "RemoteUpgrade";
import { Scout } from "Scout";
import { Task } from "tasks/Task";



export class TaskManager {
  static runLinks(roomName: string): void {
    var room = Game.rooms[roomName];
    if (room == undefined) return;

    var roomMem = room.memory as RoomMemory;
    if (roomMem == undefined) throw Error("Room Memory was undefined in runLinks");

    var links = roomMem.links;

    var master = _.find(links, l => l.linkMode == "MASTER_RECEIVE") as SmartLink;
    if (master == undefined) return;

    var masterLink = Game.getObjectById(master.linkID) as StructureLink;

    var slaves = _.filter(links, l => {
      var link = Game.getObjectById(l.linkID) as StructureLink;
      l.linkMode == "SLAVE_RECEIVE" && link.energy < link.energyCapacity
    }) as SmartLink[];

    var senders = _.filter(links, l => {
      //console.log("link id: " + l.roomName + l.linkID)
      var link = Game.getObjectById(l.linkID) as StructureLink;
      return l.linkMode == "SEND" && link.energy > 0;
    }) as SmartLink[];
    //console.log("senders: " + senders.length);
    for (var i in senders) {
      var smartLink = senders[i] as SmartLink;
      //console.log(smartLink.linkID);
      var link = Game.getObjectById(smartLink.linkID) as StructureLink;
      //console.log("sending")
      if (masterLink.energy < masterLink.energyCapacity) {
        var roomFor = masterLink.energyCapacity - masterLink.energy;
        if (roomFor > link.energy) roomFor = link.energy;
        link.transferEnergy(masterLink, roomFor)
      }
      else {
        var sortedSlaves = _.sortBy(slaves, s => {
          var slaveLink = Game.getObjectById(s.linkID) as StructureLink;
          return slaveLink.energy;
        });

        let target = Game.getObjectById(_.first(sortedSlaves).linkID) as StructureLink;
        if (target != undefined && target.energy < target.energyCapacity - 10) {
          var roomFor = target.energyCapacity - target.energy;
          link.transferEnergy(target, roomFor)
        }
      }
    }
  }

  private static runTask(task: Task) {

    //if (!task.request.isCreepTask) console.log("running structure task!")
    
    
    task.run();

    if (task.request.status == "FINISHED") {
      if (task.request.isCreepTask) TaskManager.removeWorkerTasks(task.request);
      else {
        //console.log("removing structure task!")
        TaskManager.removeStructureTasks(task.request);
      }
      return;
    }
  }
  private static removeWorkerTasks(request: ITaskRequest): void {

    const roomMem = Game.rooms[request.requestingRoomName].memory as RoomMemory;
    delete roomMem.activeWorkerRequests[request.assignedTo];
  }
  private static removeStructureTasks(request: ITaskRequest): void {

    //console.log("removing structure task: " + request.name)
    const roomMem = Game.rooms[request.requestingRoomName].memory as RoomMemory;
    delete roomMem.activeStructureRequests[request.assignedTo];
  }
  private static continueActiveRequests(roomName: string) {

    const activeWorkerTasks = CreepTaskQueue.allActive(roomName);
    //console.log(Object.keys(activeWorkerTasks).length);

    _.each(activeWorkerTasks, request => {

      if (Game.creeps[request.assignedTo] === undefined) {
        request.status == "FINISHED";
      }
           
      if (request.name == "Mine") TaskManager.runTask(new Mine(request));
      else if (request.name == "PickupEnergy") TaskManager.runTask(new PickupEnergy(request))
      else if (request.name == "Restock") TaskManager.runTask(new Restock(request));
      else if (request.name == "Upgrade") TaskManager.runTask(new Upgrade(request))
      else if (request.name == "Build") TaskManager.runTask(new Build(request));
      else if (request.name == "FillTower") TaskManager.runTask(new FillTower(request))
      else if (request.name == "FillStorage") TaskManager.runTask(new FillStorage(request))
      else if (request.name == "FillContainers") TaskManager.runTask(new FillContainers(request))
      else if (request.name == "Scout") TaskManager.runTask(new Scout(request))
      else if (request.name == "Defend") TaskManager.runTask(new Defend(request))
      else if (request.name == "RemoteUpgrade") TaskManager.runTask(new RemoteUpgrade(request))
      else if (request.name == "Dismantle") TaskManager.runTask(new Dismantle(request))
      else { console.log("Request not found..." + request.name)}

    })
    
    let activeStructureTasks = StructureTaskQueue.allActive(roomName);
    _.each(activeStructureTasks, request => {
      if (Game.getObjectById(request.assignedTo) as AnyOwnedStructure === undefined) {
        request.status == "FINISHED";
      }
      
      if (request.name == "TowerRepair") TaskManager.runTask(new TowerRepair(request));
      if (request.name == "TowerAttack") TaskManager.runTask(new TowerAttack(request));
    })
    
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
    Restock.addRequests(roomName, energyLevel);
    Mine.addRequests(roomName, energyLevel);
    //TransferEnergy.addRequests(roomName);
    FillTower.addRequests(roomName);
    Build.addRequests(roomName);
    Upgrade.addRequests(roomName, 6);
    FillStorage.addRequests(roomName)
    FillContainers.addRequests(roomName)
    Scout.addRequests(roomName);
    Dismantle.addRequests(roomName);
    //Defend.addRequests(roomName, 3);
    RemoteUpgrade.addRequests(roomName);
    //console.log("finished adding pending worker requests");
  }
  static Run(roomName: string, energyLevel: number): void {

    this.addBuildingTasks(roomName);
    this.runLinks(roomName);
    this.continueActiveRequests(roomName);

    this.addPendingRequests(roomName, energyLevel);
    this.assignPendingRequests(roomName);
  }


  private static assignPendingRequests(roomName: string) {
    let idleCreeps = utils.findIdleCreeps(roomName);
    //console.log(`found ${idleCreeps.length} idle creeps for ${roomName}`)
    //var flags = Game.flags;
    //var found = false;
    //for (var id in flags) {
    //  var flag = flags[id] as Flag;
    //  if (flag.name == roomName) {
    //    var more = utils.findIdleCreeps(flag.pos.roomName){

    //    }
    //    idleCreeps.push(utils.findIdleCreeps(flag.pos.roomName))
    //    break;
    //  }
    //}


    for (let id in idleCreeps) {
      let creep = idleCreeps[id] as Creep;
      if (creep != undefined) {
        let mem = creep.memory as CreepMemory;
        //if (mem.role =="ROLE_SCOUT") {
        //  console.log("found a scout: " + creep.name + " in room " + creep.pos.roomName);
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
          //console.log("id: " + structure.id)
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
