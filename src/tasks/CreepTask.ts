import { Task, TaskStatus } from "./Task";
import { CreepTaskRequest } from "./CreepTaskRequest";
import { CreepMemory, RoomMemory, SmartContainer, SmartSource, LinkMode, SmartLink } from "utils/memory"
import * as utils from "utils/utils";
import { CreepRole } from "utils/utils";

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
    else {
      this.creepMemory = this.creep.memory as CreepMemory;
      if (Game.time % 5 == 0) this.creep.say(`${this.request.wingDing}`);
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
  protected collectFromMasterLink(roomName: string): boolean {

    const room = Game.rooms[roomName];
    const roomMem = room.memory as RoomMemory;
   
    let masterLink = _.find(roomMem.links, l => l.linkMode == LinkMode.MASTER_RECEIVE) as SmartLink;
    if (masterLink == undefined) return false
    

    var link = Game.getObjectById(masterLink.linkID) as StructureLink;
    if (link.energy < link.energyCapacity / 2) return false;

    var result = this.creep.withdraw(link, RESOURCE_ENERGY)
    if (result == ERR_NOT_IN_RANGE) {
      this.creep.moveTo(link);
    }
    return true;
  }
  protected collectFromDroppedEnergy(roomName: string): boolean {
    //if (this.creep.carry.energy == this.creep.carryCapacity) return;
    //console.log("collect from dropped")
    const room = Game.rooms[roomName];
    const roomMemory = room.memory as RoomMemory;

    const debugSources = roomMemory.activeResourcePileIDs
      .map(s => Game.getObjectById(s) as Resource)
      .filter(ss => ss.amount > 100)
    if (debugSources.length == 0) return false;

    const sortDebug = _.sortBy(debugSources, s => s.amount / this.creep.pos.getRangeTo(s.pos)).reverse();
    //const sortDebug = _.sortBy(debugSources, s => s.amount).reverse();
    //console.log(JSON.stringify("sorted"+sortDebug.map(s=>s.amount)))
    var mine = _.first(sortDebug);
    var range = this.creep.pos.getRangeTo(mine);
    var result = this.creep.pickup(mine)
    if (result == ERR_NOT_IN_RANGE) {
      this.creep.moveTo(mine);
    }
    return true;
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
  protected collectFromContainer(roomName: string): boolean {
    const room = Game.rooms[roomName];
    const roomMemory = room.memory as RoomMemory;

    const containers = roomMemory.containers;
    var creepRole = this.creepMemory.role;
    var valids: SmartContainer[] = [];

    for (var i in containers) {
      var smartContainer = containers[i];
      var container = Game.getObjectById(smartContainer.containerID) as StructureContainer;
      if (container == null) {
        return false;
        //destroyed, filter out.
        //var newContainers: { [index: string]: SmartContainer } = { };
        //for (var i_1 in containers) {
        //  if (i_1 != i) newContainers[i_1] = containers[i_1];
        //}
        //roomMemory.containers = newContainers;
        //return false;
      }
      if (_.includes(smartContainer.allowedWithdrawRoles, creepRole) && container.store.energy > (this.creep.carryCapacity - this.creep.carry.energy)/4) {
        valids.push(smartContainer);
      }
    }
    if (valids.length == 0) return false;
    //console.log("valids found")
    const sortDebug = _.sortBy(valids, s => {
      var c = Game.getObjectById(s.containerID) as StructureContainer;
      return c.store.energy / this.creep.pos.getRangeTo(c.pos)
    }).reverse();
    var mine = Game.getObjectById(_.first(sortDebug).containerID) as StructureContainer;
    //console.log(JSON.stringify(mine))
    //var range = this.creep.pos.getRangeTo(mine);
    var result = this.creep.withdraw(mine, RESOURCE_ENERGY)
    if (result == ERR_NOT_IN_RANGE) {
      this.creep.moveTo(mine);
    }
    return true;

    //  .map(s => Game.getObjectById(s) as StructureContainer)
    //  .filter(ss => ss.amount > 50)
    //if (containers.length == 0) return false;

    //const sortDebug = _.sortBy(containers, s => this.creep.pos.getRangeTo(s.pos))
    //console.log(JSON.stringify("sorted"+sortDebug.map(s=>s.amount)))
    //var mine = _.first(sortDebug);
    //var range = this.creep.pos.getRangeTo(mine);
    //var result = this.creep.pickup(mine)
    //if (result == ERR_NOT_IN_RANGE) {
    //  this.creep.moveTo(mine);
    //}
    //return true;
  }
  protected collectFromStorage(roomName: string): boolean {
    const room = Game.rooms[roomName];
    const roomMem = room.memory as RoomMemory;
    const storage = _.first(room.find(FIND_MY_STRUCTURES).filter(s => s.structureType == "storage")) as StructureStorage;

    if (storage == undefined) {
      return false;
    }
    if (storage.store.energy < 1000) return false;

    var result = this.creep.withdraw(storage, RESOURCE_ENERGY);
    if (result == ERR_NOT_IN_RANGE) {
      this.creep.moveTo(storage);
      //return true;
    }
    return true;
    //else if (result == OK) return true;
  }
  protected collectFromTombstone(roomName: string): boolean {
    //console.log("collect from tombstone")
    const room = Game.rooms[roomName];
    //if (this.creep.carry.energy == this.creep.carryCapacity) return;
    const tombstones = room.find(FIND_TOMBSTONES).filter(t => Object.keys(t.store).length > 0) as Tombstone[]


    const byRange = _.sortBy(tombstones, t => this.creep.pos.getRangeTo(t));

    const tombstone = _.first(byRange);
    if (tombstone == undefined) return false;

    if (this.request.name == "FillStorage") {
      var result = this.creep.withdraw(tombstone, _.findKey(tombstone.store) as ResourceConstant);
      if (result == ERR_NOT_IN_RANGE) {
        this.creep.moveTo(tombstone);
        return true;
      }
      else if (result == OK) return true;
      return true;
    }
    else {
      var result = this.creep.withdraw(tombstone, RESOURCE_ENERGY);
      if (result == ERR_NOT_IN_RANGE) {
        this.creep.moveTo(tombstone);
      }
      else if (result == OK) return true;
      return false;
    }
    
   
    //const withResources = _.filter(tombstones, t => t.store.energy > 0)

    //if (withResources.length > 0) {
    //  for (const key in withResources) {
    //    if (!withResources.hasOwnProperty(key)) continue;
    //    const tombstone = withResources[key] as Tombstone;
    //    if (tombstone.store.energy == 0) continue;
    //    var result = this.creep.withdraw(tombstone, RESOURCE_ENERGY);
    //    if (result == ERR_NOT_IN_RANGE) {
    //      this.creep.moveTo(tombstone);
    //    }
    //    return true;
    //    //else if (result == OK) return;
    //  }
    //  return false;
    //}
    //else return false;
  }

  protected collectFromSource(roomName: string): boolean {

    const roomMem = Game.rooms[roomName].memory as RoomMemory;
   
    var withEnergy = _.filter(roomMem.harvestLocations, s => {
      var source = Game.getObjectById(s.sourceID) as Source;
      return source.energy > 0;
    });
    var site = Game.getObjectById(this.request.targetID) as AnyStructure | ConstructionSite | Source;
    if (site == null) return false;
    //var sortedByRange = _.sortBy(withEnergy, h => { site.pos.getRangeTo(Game.getObjectById(h.sourceID) as Source) }).reverse() as SmartSource[];
    //if (this.creepMemory.role == CreepRole.ROLE_REMOTE_UPGRADER && roomName == "W5S43") {
    //  for (var id in smartSources) {
    //    var smartSource = smartSources[id];
    //    var source = Game.getObjectById(smartSource.sourceID) as Source;
    //    console.log("id: " + source.id + ", distance: " + this.creep.pos.getRangeTo(source));

    //  }
    //  //_.forIn(smartSources, s => {
    //  //  var smartSource = smartSources[s];
    //  //  var source = Game.getObjectById(smartSource.sourceID) as Source;

    //  //  var path = PathFinder.search(this.creep.pos, source.pos);
    //  //  var length = path.path.length;
    //  //  console.log("Path length: " + length)
    //  //})
    //}
    //var test = roomMem.harvestLocations[Object.keys(roomMem.harvestLocations)[0]]
    var closest = _.min(withEnergy, s => site.pos.getRangeTo(Game.getObjectById(s.sourceID) as Source))

    if (closest == undefined) return false;
    //console.log("test: " + closest.sourceID);
    //for (var i in sortedByRange) {
    //  var s = sortedByRange[i];
    //  if (s != undefined) {
    //    if (this.request.name == "Build") console.log("id: " + s.sourceID + ", distance: " + site.pos.getRangeTo(Game.getObjectById(s.sourceID) as Source));
    //  }
    //}

    var sourceID = closest.sourceID;
    var source = Game.getObjectById(sourceID) as Source
    //if (this.creepMemory.role == CreepRole.ROLE_REMOTE_UPGRADER && roomName == "W5S43")  console.log("to test: " + this.creep.pos.getRangeTo(source))

    var result = this.creep.harvest(source)
    if (result == ERR_NOT_IN_RANGE) {
      this.creep.moveTo(source);
      this.creep.harvest(source);
    }
    return true;

  }

}
