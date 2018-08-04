import { CreepTaskRequest } from "../CreepTaskRequest";
import { CreepTask } from "../CreepTask";
import { SmartSource } from "utils/memory"
import * as utils from "utils/utils";
import { CreepTaskQueue } from "../CreepTaskQueue";
import { Task } from "../Task";

export class MineRequest extends CreepTaskRequest {
  priority: number = 1;
  requiredRole: CreepRole[] = ["ROLE_MINER"]
  name: string = "Mine";
  maxConcurrent: number;
  id: number
  //source: SmartSource;
  constructor(roomName: string, sourceID: string) {
    super(roomName, `💲`, sourceID);

    const roomMem = Game.rooms[roomName].memory as RoomMemory;
    //console.log("source id in mine req ctor: " + sourceID)
    const source = roomMem.harvestLocations[sourceID] as SmartSource;
    //this.source = _.find(roomMem.harvestLocations, h => h.sourceID == sourceID) as SmartSource;
    if (source == undefined) console.log("You cant init a mine request with an undefined source.")

    //console.log("after finding source: " + this.source.sourceID)
    this.id = _.random(0, 10);
    var minerCount = utils.creepCount(roomName,"ROLE_MINER");
    this.maxConcurrent = minerCount;
    //console.log("max concurrent: " + this.maxConcurrent)
  }
}

export class Mine extends CreepTask {
  protected init(): void {
    super.init();
    const roomMem = Game.rooms[this.request.roomName].memory as RoomMemory;
    const source = roomMem.harvestLocations[this.request.targetID] as SmartSource;
    const request = this.request as MineRequest;
    source.assignedTo.push(request.assignedTo);
    console.log("mine init assigned to " + source.assignedTo)
    this.request.status = "PREPARE";
    
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == "FINISHED") return;

    this.request.status = "IN_PROGRESS";
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == "FINISHED") return;

    if (this.creep.carryCapacity == 0) {
      this.harvest();

    }
    else {
      if (this.creep.carry.energy >= this.creep.carryCapacity - 10) this.deliver();
      else this.harvest();
    
    }
    //else(this.creep.drop(RESOURCE_ENERGY))
    
  }
  protected finish(): void {
    super.finish();
  }

  static addRequests(roomName: string, energyLevel: number): void {
    const room = Game.rooms[roomName];
    const mem = room.memory as RoomMemory;

    //const unassigned = _.filter(mem.harvestLocations, h => h.assignedTo === null) as SmartSource[];
    
    //if (unassigned.length === 0) return;
    var minersPerSource = 1;
    //var energyLevel = RoomManager.getRoomEnergyLevel(roomName);
    if (energyLevel < 3) {
      minersPerSource = 2;
    }
    for (const key in mem.harvestLocations) {
      const smartSource = mem.harvestLocations[key] as SmartSource;
      //console.log("sourceid: " + smartSource.sourceID)
      if (smartSource.assignedTo.length == minersPerSource) continue;
      var needed = minersPerSource - smartSource.assignedTo.length;
      for (var i = 0; i < needed; i++) {
        
        var request = new MineRequest(roomName, smartSource.sourceID);
        var totalCurrent = CreepTaskQueue.totalCount(request.roomName, request.name);
        //console.log("total current:" + totalCurrent)
        if (totalCurrent < request.maxConcurrent) {
          //console.log("about to add source for this id: " + smartSource.sourceID)
          CreepTaskQueue.addPendingRequest(request);
        }
      }
      
    }
  }

  private harvest() {
    const creep = Game.creeps[this.request.assignedTo] as Creep;
    const source = Game.getObjectById(this.request.targetID) as Source
    //creep.say("moving")
    if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
      
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }

  }
  private deliver() {
    const creep = Game.creeps[this.request.assignedTo] as Creep;
    const room = Game.rooms[this.request.roomName];
    const roomMemory = room.memory as RoomMemory;

    var smartSource = roomMemory.harvestLocations[this.request.targetID];
    //if (room.name == "W5S43") {
    //  console.log("smartsource id:" + smartSource.linkID)
    //}
    if (smartSource.linkID != "") {
      
      var link = Game.getObjectById(smartSource.linkID) as StructureLink;
      if (creep.transfer(link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        creep.moveTo(link, { visualizePathStyle: { stroke: '#ffffff' } });
      }

    }
    else {
      const container = utils.findClosestContainer(this.request.roomName, creep.id, true, true) as StructureContainer;
      if (container == undefined) {
        creep.drop(RESOURCE_ENERGY);
        return;
      }

      if (container.store.energy == container.storeCapacity) return;

      if (creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        creep.moveTo(container, { visualizePathStyle: { stroke: '#ffffff' } });
      }

    }

    
  }

  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }
}

