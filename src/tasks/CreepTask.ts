import { Task, TaskStatus } from "./Task";
import { CreepTaskRequest } from "./CreepTaskRequest";
import { CreepMemory, RoomMemory } from "utils/memory"
import * as utils from "utils/utils";

export abstract class CreepTask extends Task {
  public request: CreepTaskRequest;
  protected creep: Creep;
  creepMemory!: CreepMemory;

  constructor(request: CreepTaskRequest) {
    super(request);

    this.request = request as CreepTaskRequest;
    this.creep = Game.creeps[this.request.assignedTo];
    if (this.creep == undefined || this.creep.memory == undefined) {
      //console.log("You cant create a task with an undefined creep.")
      this.request.status == TaskStatus.FINISHED;
      return;
    }
    this.creepMemory = this.creep.memory as CreepMemory;

  }
  protected init(): void {

    this.creep = Game.creeps[this.request.assignedTo];
    if (this.creep == undefined || this.creep.memory == undefined) {
      //console.log("You cant create a task with an undefined creep.")
      this.request.status == TaskStatus.FINISHED;
      return;
    }
      
     
  }
  protected prepare(): void
  {
    this.creep = Game.creeps[this.request.assignedTo];
    if (this.creep == undefined || this.creep.memory == undefined) {
      //console.log("during prep, creep was undefined - finishing task")
      this.request.status = TaskStatus.FINISHED;
    }
    else {
      this.creepMemory = this.creep.memory as CreepMemory;
    }
    
  }
 
  protected continue(): void {
    this.creep = Game.creeps[this.request.assignedTo];
    if (this.creep == undefined || this.creep.memory == undefined) {
      //console.log("during continue, creep was undefined - finishing task")
      this.request.status = TaskStatus.FINISHED;
    }
    else {
      this.creepMemory = this.creep.memory as CreepMemory;
      if (Game.time % 5 == 0) this.creep.say(`${this.request.wingDing}`);
    }
  }

  protected finish(): void {

    const creep = Game.creeps[this.request.assignedTo];
    if (creep != undefined && creep.memory != undefined) {
      var creepMemory = creep.memory as CreepMemory;
      creepMemory.idle = true;
      creepMemory.currentTask = "";
      creep.say("✔")
      
    }
  }

  protected collectFromDroppedEnergy(roomName: string) : boolean{
    const room = Game.rooms[roomName];
    if (this.creep.carry.energy == this.creep.carryCapacity) return false;
    const resources = room.find(FIND_DROPPED_RESOURCES) as Resource[];

    if (resources.length > 0) {
      for (const key in resources) {
        if (!resources.hasOwnProperty(key)) continue;
        const resource = resources[key] as Resource;
        if (resource.resourceType != RESOURCE_ENERGY) continue;
        var result = this.creep.pickup(resource)
        if (result == ERR_NOT_IN_RANGE) {
          this.creep.moveTo(resource);
        }
        else if (result == OK) return true;
      }
    }
    return false;
  }

  protected collectFromTombstone(roomName: string) {
    const room = Game.rooms[roomName];
    if (this.creep.carry.energy == this.creep.carryCapacity) return;
    const tombstones = room.find(FIND_TOMBSTONES) as Tombstone[];
    if (tombstones.length > 0) {
      for (const key in tombstones) {
        if (!tombstones.hasOwnProperty(key)) continue;
        const tombstone = tombstones[key] as Tombstone;
        if (tombstone.store.energy == 0) continue;
        var result = this.creep.withdraw(tombstone, RESOURCE_ENERGY);
        if (result == ERR_NOT_IN_RANGE) {
          this.creep.moveTo(tombstone);
        }
        else if (result == OK) return;
      }
    }
  }

  protected collectFromSource(roomName: string) {

    const roomMem = Game.rooms[roomName].memory as RoomMemory;
    var sourceID = _.first(roomMem.harvestLocations).sourceID;
    var source = Game.getObjectById(sourceID) as Source
    var result = this.creep.harvest(source)
    if (result == ERR_NOT_IN_RANGE) {
      this.creep.moveTo(source);
      this.creep.harvest(source);
    }
  }

}
