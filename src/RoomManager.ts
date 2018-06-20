import { RoomMemory, CreepMemory, StructureMemory, SmartStructure, SmartSource } from "utils/memory";
import { CreepManager } from "CreepFactory";
import * as utils from "utils/utils";
import { TaskManager } from "taskManager";
import { CreepRole } from "utils/utils";

export let creeps: Creep[];
export let creepCount: number = 0;

export class RoomManager {
  loadResources(roomName: string): void {
    const room = Game.rooms[roomName];
    const roomMem = room.memory as RoomMemory
    const resources = room.find(FIND_DROPPED_RESOURCES) as Resource[];
    //console.log(JSON.stringify(resources))
    const sorted = _.sortBy(resources, r => r.amount);
    roomMem.activeResourcePileIDs = sorted.map(u => u.id);

  }
  creeps: Array<Creep> = [];
  creepCount: number = 0;

  public static minimumWorkerCount: number = 1;
  public static minimumMinerCount: number = 2;
  public static maxWorkersPerRoom: number = 3;
  public static maxUpgradersPerRoom: number = 5;
  minerCount: number = 0;

  public Run(roomName: string): void {
    RoomManager.loadHarvestingSpots(roomName);

    this.loadCreeps(roomName);
    this.loadResources(roomName);
    this.loadStructures(roomName);
    this.spawnMissingMiners(roomName);
    this.spawnMissingWorkers(roomName);
    this.spawnMissingUpgraders(roomName);

    TaskManager.Run(roomName, RoomManager.getRoomEnergyLevel(roomName));
  }
  private loadCreeps(roomName: string) {
    let room = Game.rooms[roomName];
    creeps = room.find(FIND_MY_CREEPS);
    let spawn = room.find(FIND_MY_SPAWNS)[0];
    creepCount = creeps.length;
    for (let id in creeps) {
      let creep = creeps[id];
      let mem = creep.memory as CreepMemory;
      if (mem.alive === undefined || mem.alive == false) {
        const memory: CreepMemory =
        {
          spawnID: spawn.id,
          idle: true,
          alive: true,
          role: utils.getRole(creep.name),
          currentTask: "",
        };
        creep.memory = memory;
      }
    }
  }
  private loadStructures(roomName: string) {
    let room = Game.rooms[roomName]
    let memory = room.memory as RoomMemory;
    if (memory.smartStructures.length == 0) {
      memory.smartStructures = [];
      let structures = room.find(FIND_STRUCTURES);
      let smartStructures = _.filter(structures, function (structure) {
        return (
          structure.structureType == "tower"
        );
      });
      for (let id in smartStructures) {
        let structure = smartStructures[id];
        const newStructureMemory: StructureMemory =
        {
          idle: true,
          alive: true,
          currentTask: ""
        }
        const smartStructure: SmartStructure =
        {
          id: structure.id,
          memory: newStructureMemory
        }

        memory.smartStructures.push(smartStructure);
      }
    }
  }
  private spawnMissingWorkers(roomID: string) {
    const miners = utils.creepCount(roomID, CreepRole.ROLE_MINER);

    const currentWorkerCount = utils.creepCount(roomID, CreepRole.ROLE_WORKER);
    if (miners < RoomManager.minimumMinerCount - 1 && currentWorkerCount > 0) {
      console.log("skipping workers for now.")
      return;
    }

    //console.log("miners: " + miners + " , workers: " + currentWorkerCount)
    const spawns = utils.findSpawns(roomID);

    // let currentWorkers = creeps.filter(c =>
    // {
    // 	let mem = c.memory as CreepMemory;
    // 	return mem.role == CreepRole.ROLE_WORKER;
    // });
    let workersNeeded: number = RoomManager.maxWorkersPerRoom - currentWorkerCount;
    if (workersNeeded === 0) {
      //console.log("no workers needed.")
      return;
    }

    let workersSpawned: number = 0;
    _.each(spawns, (spawn) => {
      if (workersSpawned < workersNeeded) {
        let spawner = spawn as StructureSpawn;
        if (CreepManager.trySpawnCreep(spawner, this.getWorkerBodyParts(roomID), CreepRole.ROLE_WORKER)) {
          workersSpawned++;
        }
      }
    })
  }
  private spawnMissingUpgraders(roomID: string) {
    const workers = utils.creepCount(roomID, CreepRole.ROLE_WORKER);
    if (workers < RoomManager.minimumWorkerCount + 1) return;

    const miners = utils.creepCount(roomID, CreepRole.ROLE_MINER);
    if (miners < RoomManager.minimumMinerCount) return;

    const spawns = utils.findSpawns(roomID);
    let currentCount = utils.creepCount(roomID, CreepRole.ROLE_UPGRADER);
    // let currentWorkers = creeps.filter(c =>
    // {
    // 	let mem = c.memory as CreepMemory;
    // 	return mem.role == CreepRole.ROLE_WORKER;
    // });
    let needed: number = RoomManager.maxUpgradersPerRoom - currentCount;
    if (needed === 0) return;

    let spawned: number = 0;
    _.each(spawns, (spawn) => {
      if (spawned < needed) {
        let spawner = spawn as StructureSpawn;
        if (CreepManager.trySpawnCreep(spawner, this.getUpgraderBodyParts(roomID), CreepRole.ROLE_UPGRADER)) {
          spawned++;
        }
      }
    })
  }
  private spawnMissingMiners(roomName: string) {
    //console.log("spawning miners")
    const spawns = utils.findSpawns(roomName);
    let currentMiners = creeps.filter(c => {
      let mem = c.memory as CreepMemory;
      return mem.role == CreepRole.ROLE_MINER;
    });
    var minersPerSource = 1;
    var energyLevel = RoomManager.getRoomEnergyLevel(roomName);
    if (energyLevel < 3) {
      minersPerSource = 2;
    }
    let room = Game.rooms[roomName]
    let sources = room.find(FIND_SOURCES);
    this.minerCount = sources.length * minersPerSource

    let minersNeeded: number = this.minerCount - currentMiners.length
    // console.log("Miners needed: " + minersNeeded)
    if (minersNeeded === 0) return;

    let minersSpawned: number = 0;
    _.each(spawns, (spawn) => {
      if (minersSpawned < minersNeeded) {
        let spawner = spawn as StructureSpawn;
        //console.log("spawning miner!")
        if (CreepManager.trySpawnCreep(spawner, this.getMinerBodyParts(roomName, RoomManager.getRoomEnergyLevel(roomName)), CreepRole.ROLE_MINER)) {
          minersSpawned++;
        }
      }
    })
  }
  private getWorkerBodyParts(roomID: string): BodyPartConstant[] {
    let energyLevel = RoomManager.getRoomEnergyLevel(roomID);
    let room = Game.rooms[roomID];
    let currentEnergy = room.energyAvailable;

    //if we run out of creeps for any reason, this will keep us respawning automatically.
    if (creeps.length < 3 && currentEnergy < 800) energyLevel = 1;

    //console.log("Room energy level: " + energyLevel)
    switch (energyLevel) {
      case 1: return [WORK, MOVE, MOVE, CARRY];
      //case 2: return [WORK, WORK, MOVE, MOVE, CARRY, CARRY];
      case 2: return [WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
      //case 3: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
      case 3: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
      default: return [WORK, MOVE, MOVE, CARRY];
    }
  }
  private getUpgraderBodyParts(roomID: string): BodyPartConstant[] {
    let energyLevel = RoomManager.getRoomEnergyLevel(roomID);
    let room = Game.rooms[roomID];
    let currentEnergy = room.energyAvailable;

    //if we run out of creeps for any reason, this will keep us respawning automatically.
    if (creeps.length < 3 && currentEnergy < 800) energyLevel = 1;

    //console.log("Room energy level: " + energyLevel)
    switch (energyLevel) {
      case 1: return [WORK, MOVE, MOVE, CARRY];
      //case 2: return [WORK, WORK, MOVE, MOVE, CARRY, CARRY];
      case 2: return [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY]
      //case 3: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
      case 3: return [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY]
      default: return [WORK, MOVE, MOVE, CARRY];
    }
  }
  private getMinerBodyParts(roomID: string, energyLevel: number): BodyPartConstant[] {

    //let energyLevel = this.getRoomEnergyLevel(roomID);
    let room = Game.rooms[roomID];
    let currentEnergy = room.energyAvailable;

    //if we run out of creeps for any reason, this will keep us respawning automatically.
    if (creeps.length < 3 && currentEnergy < 800) energyLevel = 1;

    //console.log("Room energy level: " + energyLevel)
    switch (energyLevel) {
      case 1: return [WORK, WORK, MOVE, CARRY];
      //case 2: return [WORK, WORK, MOVE, MOVE, CARRY, CARRY];
      case 2: return [WORK, WORK, WORK, WORK, MOVE, CARRY]
      //case 3: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
      case 3: return [WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
      default: return [WORK, MOVE, MOVE, CARRY];
    }
  }
  static getRoomEnergyLevel(roomID: string): number {
    let room = Game.rooms[roomID];
    let cap = room.energyCapacityAvailable;
    if (cap < 500) return 1;
    else if (cap <= 800) return 2;
    else return 3;
  }

  static loadHarvestingSpots(roomName: string) {
    let room = Game.rooms[roomName];
    let roomMemory = room.memory as RoomMemory;

    if (Object.keys(roomMemory.harvestLocations).length > 0) return;
    console.log("loading harvesting spots")
    let sources = room.find(FIND_SOURCES);


    let spots: { [index: string]: SmartSource } = { };

    for (const sourceID in sources) {
      let source = sources[sourceID];
      const spot: SmartSource = {
        sourceID: source.id,
        roomName: roomName,
        assignedTo: [],
      }
      spots[source.id] = spot;
      //spots.push(spot);
      roomMemory.harvestLocations = spots;
    }
    // 	let sourcePosition = source.pos as RoomPosition;
    // 	let right = room.getPositionAt(sourcePosition.x + 1, sourcePosition.y);
    // 	if (right != null) possibles.push(new HarvestSpot(source.id, right));

    // 	let left = room.getPositionAt(sourcePosition.x - 1, sourcePosition.y)
    // 	if (left != null) possibles.push(new HarvestSpot(source.id, left));

    // 	let top = room.getPositionAt(sourcePosition.x, sourcePosition.y - 1)
    // 	if (top != null) possibles.push(new HarvestSpot(source.id, top));

    // 	let bot = room.getPositionAt(sourcePosition.x, sourcePosition.y + 1)
    // 	if (bot != null) possibles.push(new HarvestSpot(source.id, bot));

    // 	let tr = room.getPositionAt(sourcePosition.x + 1, sourcePosition.y - 1)
    // 	if (tr != null) possibles.push(new HarvestSpot(source.id, tr));

    // 	let tl = room.getPositionAt(sourcePosition.x - 1, sourcePosition.y - 1)
    // 	if (tl != null) possibles.push(new HarvestSpot(source.id, tl));

    // 	let br = room.getPositionAt(sourcePosition.x + 1, sourcePosition.y + 1)
    // 	if (br != null) possibles.push(new HarvestSpot(source.id, br));

    // 	let bl = room.getPositionAt(sourcePosition.x - 1, sourcePosition.y + 1)
    // 	if (bl != null) possibles.push(new HarvestSpot(source.id, bl));

    // }
    // for (const id in possibles)
    // {
    // 	let possible = possibles[id];
    // 	if (possible.pos !== null)
    // 	{
    // 		const found: string = possible.pos.lookFor(LOOK_TERRAIN) as any;
    // 		if (found != "wall")
    // 		{
    // 			spots.push(possible);
    // 		}
    // 	}
    // }


  }

  //static GetClosestOrAssignedHarvestLocation(roomName: string, creepID: string, locationID: string = ""): SmartSource | undefined {
  //  let creep = Game.getObjectById(creepID) as Creep;
  //  let room = Game.rooms[roomName];
  //  let roomMemory = room.memory as RoomMemory;
  //  if (locationID == "") {
  //    locationID = creep.id;
  //  }

  //  let locObj = Game.getObjectById(locationID) as Structure | Creep;
  //  if (roomMemory.harvestLocations == {}) {
  //    console.log("this should never happen...")
  //    this.loadHarvestingSpots(roomName);
  //  }
  //  let harvestingSpots = roomMemory.harvestLocations.filter(spot => {

  //    let source = Game.getObjectById(spot.sourceID) as Source;
  //    return source.energy > 0;
  //  });

  //  let assignedSpot = harvestingSpots.filter((spot) => {
  //    return spot.assignedTo == creep.name;
  //  })[0];

  //  if (assignedSpot !== undefined) return assignedSpot;
  //  else {
  //    let openSpots = harvestingSpots.filter((spot) => {
  //      return spot.assignedTo == null;
  //    });
  //    _.sortBy(openSpots, spot => {
  //      let sourceID = spot.sourceID;
  //      let source = Game.getObjectById(sourceID) as Source;
  //      return locObj.pos.getRangeTo(source);
  //    }).reverse();

  //    if (openSpots == undefined) return undefined;
  //    let firstOpen = openSpots[0];
  //    if (firstOpen == undefined) return undefined;

  //    firstOpen.assignedTo = creep.name;
  //    return firstOpen;
  //  }
  //}

}



