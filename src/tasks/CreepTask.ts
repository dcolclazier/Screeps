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
  protected prepare(): void {
    this.creep = Game.creeps[this.request.assignedTo];
    if (this.creep == undefined || this.creep.memory == undefined) {
      //console.log("during prep, creep was undefined - finishing task")
      this.request.status = TaskStatus.FINISHED;
    }
    else {
      this.creepMemory = this.creep.memory as CreepMemory;
      if (Game.time % 5 == 0) this.creep.say(`${this.request.wingDing}`);
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
    //console.log("finished base continue creep task")
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

  protected collectFromDroppedEnergy(roomName: string)  {
    if (this.creep.carry.energy == this.creep.carryCapacity) return;
    //console.log("collect from dropped")
    const room = Game.rooms[roomName];
    const roomMemory = room.memory as RoomMemory;
  
    const debugSources = roomMemory.activeResourcePileIDs
      .map(s => Game.getObjectById(s) as Resource)
      .filter(ss => ss.amount > 50)
    if (debugSources.length == 0) return;

    //const sortDebug = _.sortBy(debugSources, s => this.creep.pos.getRangeTo(s.pos))
    const sortDebug = _.sortBy(debugSources, s => s.amount).reverse();
    console.log(JSON.stringify("sorted"+sortDebug.map(s=>s.amount)))
    var mine = _.first(sortDebug);
    var range = this.creep.pos.getRangeTo(mine);
    var result = this.creep.pickup(mine)
    if (result == ERR_NOT_IN_RANGE) {
      this.creep.moveTo(mine);
    }
    //console.log("collect from dropped")
    //console.log(JSON.stringify(resources))
    //const sorted = _.sortBy(resources, r => r.amount);
    //if (sorted.length > 0) {
    //  for (const key in sorted) {
    //    if (!sorted.hasOwnProperty(key)) continue;
    //    const resource = sorted[key] as Resource;
    //    if (resource.resourceType != RESOURCE_ENERGY) continue;
    //    var result = this.creep.pickup(resource)
    //    if (result == ERR_NOT_IN_RANGE) {
    //      this.creep.moveTo(resource);
    //      break;
    //    }
    //    else if (result == OK) return true;
    //  }
    //}
    //return false;
  }

  protected collectFromTombstone(roomName: string) {
    //console.log("collect from tombstone")
    const room = Game.rooms[roomName];
    if (this.creep.carry.energy == this.creep.carryCapacity) return;
    const tombstones = room.find(FIND_TOMBSTONES) as Tombstone[];
    const withResources = _.filter(tombstones, t=> t.store.energy > 0)
    if (withResources.length > 0) {
      for (const key in withResources) {
        if (!withResources.hasOwnProperty(key)) continue;
        const tombstone = withResources[key] as Tombstone;
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
    var smartSources = roomMem.harvestLocations;
    _.forIn(smartSources, s => {

    })
    var test = roomMem.harvestLocations[Object.keys(roomMem.harvestLocations)[0]]

    //var sourceID = _.first(roomMem.harvestLocations).sourceID;
    var source = Game.getObjectById(test.sourceID) as Source
    var result = this.creep.harvest(source)
    if (result == ERR_NOT_IN_RANGE) {
      this.creep.moveTo(source);
      this.creep.harvest(source);
    }
  }

}
