import { CreepTaskRequest } from "../CreepTaskRequest";
import { CreepTask } from "../CreepTask";
import * as utils from "utils/utils";
import { CreepTaskQueue } from "../CreepTaskQueue";
import { Task } from "../Task";

export class MineRequest extends CreepTaskRequest {
  priority: number = 1;
  validRoles: CreepRole[] = ["ROLE_MINER"]
  name: string = "Mine";
  maxConcurrent: number;

  constructor(originatingRoomName: string, targetRoomName: string, sourceID: string) {
    super(originatingRoomName, targetRoomName, sourceID, `💲`);

    const source = Game.getObjectById(sourceID);
    if (source == undefined) console.log("You cant init a mine request with an undefined source.")
    var minerCount = global.creepManager.creeps(targetRoomName, "ROLE_MINER").length;
    this.maxConcurrent = minerCount;
  }
}

export class Mine extends CreepTask {
  static taskName: string = "Mine";
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }
  protected init(): void {
    super.init();
    if (this.request.status != "INIT") return;
    if (this.creep == null) {
      this.request.status = "FINISHED";
      return;
    }
    if (this.creep.room.name == this.request.targetRoomName) {
      if ((this.creep.pos.x >= 1 && this.creep.pos.x <= 48) && (this.creep.pos.y >= 1 && this.creep.pos.y <= 48))
        this.request.status = "WORK";
      else this.creep.travelTo(new RoomPosition(25, 25, this.request.targetRoomName));
    }
    else this.creep.travelTo(new RoomPosition(25, 25, this.request.targetRoomName));
  }

  protected work(): void {
    super.work();
    if (this.request.status != "WORK") return;

    if (this.creep.carryCapacity == 0) this.harvest();
    else {
      if (this.creep.carry.energy >= this.creep.carryCapacity - 10) this.deliver();
      this.harvest();
    }
    
  }


  private static addOwnedRequest(roomName: string): void {
    const room = Game.rooms[roomName];
    if (room == undefined) return;

    var minersPerSource = 1;
    if (global.roomManager.getEnergyLevel(roomName) < 3) {
      minersPerSource = 2;
    }
    const sources = global.roomManager.sources(roomName);
    for (const i in sources) {
      const source = sources[i];
      const currentTasks = CreepTaskQueue.getTasks(roomName, roomName, Mine.taskName, source.id).length;
      
      const neededTasks = minersPerSource - currentTasks;
      for (let n = 0; n < neededTasks; n++) {
        CreepTaskQueue.addPendingRequest(new MineRequest(roomName, roomName, source.id));
      }
    }
    
  }
  
  private static addRemoteRequest(roomName: string): void {
    const room = Game.rooms[roomName];
    if (room == undefined) return;
    var roomMem = <RemoteHarvestRoomMemory>Memory.rooms[roomName];
    var minersPerSource = 1;
   
    const sources = global.roomManager.sources(roomName);
    for (const i in sources) {
      const source = sources[i];
      const currentTasks = CreepTaskQueue.getTasks(roomMem.baseRoomName, roomName, Mine.taskName, source.id).length;

      const neededTasks = minersPerSource - currentTasks;
      for (let n = 0; n < neededTasks; n++) {
        CreepTaskQueue.addPendingRequest(new MineRequest(roomMem.baseRoomName, roomName, source.id));
      }
    }
   
  }
  static addRequests(roomName: string): void {

    const roomMemory = Memory.rooms[roomName];
    if (roomMemory == undefined) return;

    switch (roomMemory.roomType) {
      case "OWNED": this.addOwnedRequest(roomName); break;
      case "REMOTE_HARVEST":
      case "SOURCE_KEEPER": this.addRemoteRequest(roomName); break;
    }

  }

  private harvest() {
    const source = Game.getObjectById(this.request.targetID) as Source
    if (this.flee2(6, this.request.targetRoomName)) return;
    
    if (this.creep.harvest(source) == ERR_NOT_IN_RANGE) {

      this.creep.travelTo(source);
    }

    const containers = this.creep.pos.findInRange(FIND_STRUCTURES, 1).filter(s => s.structureType == "container") as StructureContainer[];
    if (containers.length == 0) return;
    const container = <StructureContainer>containers[0];

    if (container != undefined && container.hits < container.hitsMax) {
      this.creep.repair(container);
    }

  }
  private deliver() {

    const room = Game.rooms[this.request.targetRoomName];
    if (this.flee2(6, this.request.targetRoomName)) return;
    if (Memory.rooms[this.request.targetRoomName].roomType == "REMOTE_HARVEST") {

      const sites = _.sortBy(this.creep.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 3), s => s.progressTotal);
      if (sites.length > 0) {
        this.creep.build(sites[0]);
      }
    }
    const source = _.find(global.roomManager.sources(this.request.targetRoomName), s => s.id == this.request.targetID);
    if (source == undefined) {
      console.log("ERROR:Mine::deliver -> source was undefined...")
      return;
    }
    if (source.linkID != "") {
      var link = Game.getObjectById(source.linkID) as StructureLink;
      if (this.creep.transfer(link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        this.creep.travelTo(link);
      }

    }
    else if (source.containerID != "") {
      const containers = global.roomManager.containers(this.request.targetRoomName);
      const container = _.find(containers, c => c.id == source.containerID);
      if (container == undefined) {
        console.log("ERROR:Mine::deliver -> container was undefined...")
        return;
      }
      const c = <StructureContainer>Game.getObjectById(container.id);
      if (c.hits < c.hitsMax) this.creep.repair(c);
      var result = this.creep.transfer(c, RESOURCE_ENERGY)
      if (result == ERR_NOT_IN_RANGE) {
        this.creep.travelTo(container);
      }
      else if (result == ERR_FULL) {
        this.creep.drop(RESOURCE_ENERGY)
      }
    }
    else {
      this.creep.drop(RESOURCE_ENERGY);
    }

  }

}

