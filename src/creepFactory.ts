import { CreepMemory, RoomMemory } from "utils/memory";
import { CreepRole, getRoleString } from "utils/utils";
import * as utils from "utils/utils"
import { RoomManager } from "RoomManager";

export class CreepManager {
  

  static GetCreepParts(role: CreepRole, roomEnergyLevel: number): BodyPartConstant[] {

    switch (role) {
      case CreepRole.ROLE_MINER: return CreepManager.getMinerBodyParts(roomEnergyLevel);
      case CreepRole.ROLE_UPGRADER: return CreepManager.getUpgraderBodyParts(roomEnergyLevel);
      case CreepRole.ROLE_WORKER: return CreepManager.getWorkerBodyParts(roomEnergyLevel);
      case CreepRole.ROLE_SCOUT: return CreepManager.getScoutBodyParts(roomEnergyLevel);
      case CreepRole.ROLE_CARRIER: return CreepManager.getCarrierBodyParts(roomEnergyLevel);
      case CreepRole.ROLE_DEFENDER: return CreepManager.getDefenderBodyParts(roomEnergyLevel);
      case CreepRole.ROLE_REMOTE_UPGRADER: return CreepManager.getRemoteUpgraderBodyParts(roomEnergyLevel);
      default: throw new Error(`${role} is not a valid creep role.`);
    }
  }

  static spawnMissingCreeps(roomName: string, energyLevel: number) {
    //console.log("spawning missing creeps.")
    CreepManager.spawnMissingMiners(roomName, energyLevel);
    CreepManager.spawnMissingWorkers(roomName, energyLevel);
    CreepManager.spawnMissingUpgraders(roomName, energyLevel);
    CreepManager.spawnMissingCarriers(roomName, energyLevel);
    CreepManager.spawnMissingScouts(roomName, energyLevel);
    CreepManager.spawnMissingRemoteUpgraders(roomName, energyLevel);
    //CreepManager.spawnMissingDefenders(roomName, energyLevel);
    //console.log("spawned missing creeps.")
  }


  static trySpawnCreep(spawn: StructureSpawn, role: CreepRole, energyLevel: number) {

    console.log("trying to spawn a " + utils.getRoleString(role))
    var bodyParts = CreepManager.GetCreepParts(role, energyLevel);
    return this.spawnCreep(spawn, bodyParts, role) == OK

  }
  private static getUpgraderBodyParts(energyLevel: number): BodyPartConstant[] {

    switch (energyLevel) {
      case 1: return [WORK, MOVE, MOVE, CARRY];
      case 2: return [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY]
      case 3: return [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY]
      default: return [WORK, MOVE, MOVE, CARRY];
    }
  }
  private static getDefenderBodyParts(energyLevel: number): BodyPartConstant[] {

    switch (energyLevel) {
      case 1: return [WORK, MOVE, MOVE, CARRY];
      case 2: return [ATTACK, ATTACK, MOVE, MOVE]
      case 3: return [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY]
      default: return [WORK, MOVE, MOVE, CARRY];
    }
  }
  private static getRemoteUpgraderBodyParts(energyLevel: number): BodyPartConstant[] {

    switch (energyLevel) {
      case 1: return [WORK, MOVE, MOVE, CARRY];
      case 2: return [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY]
      case 3: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
      default: return [WORK, MOVE, MOVE, CARRY];
    }
  }
  private static getWorkerBodyParts(energyLevel: number): BodyPartConstant[] {

    switch (energyLevel) {
      case 1: return [WORK, MOVE, MOVE, CARRY];
      case 2: return [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY]
      case 3: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
      default: return [WORK, MOVE, MOVE, CARRY];
    }
  }
  private static getCarrierBodyParts(energyLevel: number): BodyPartConstant[] {

    console.log("getting carrier body parts")
    switch (energyLevel) {
      case 1: return [MOVE, MOVE, CARRY, CARRY];
      case 2: return [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY]
      case 3: return [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY]
      default: return [WORK, MOVE, MOVE, CARRY];
    }
  }
  private static getMinerBodyParts(energyLevel: number): BodyPartConstant[] {

    switch (energyLevel) {
      case 1: return [WORK, WORK, MOVE, MOVE];
      case 2: return [WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE]
      case 3: return [WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]
      default: return [WORK, WORK, MOVE, MOVE];
    }
  }
  private static getScoutBodyParts(energyLevel: number): BodyPartConstant[] {

    switch (energyLevel) {
      case 1: return [TOUGH, TOUGH, TOUGH, WORK, MOVE, MOVE, MOVE, MOVE];
      case 2: return [TOUGH, TOUGH, TOUGH, HEAL, MOVE, MOVE, MOVE, MOVE]
      case 3: return [TOUGH, TOUGH, TOUGH, CLAIM, MOVE, MOVE, MOVE, MOVE]
      default: return [TOUGH, TOUGH, MOVE, MOVE];
    }
  }
  static spawnMissingRemoteUpgraders(roomName: string, energyLevel: number) {
    const miners = utils.creepCount(roomName, CreepRole.ROLE_MINER);
    const workers = utils.creepCount(roomName, CreepRole.ROLE_WORKER);
    const carriers = utils.creepCount(roomName, CreepRole.ROLE_CARRIER);
    const upgraders = utils.creepCount(roomName, CreepRole.ROLE_UPGRADER);
    const roomMem = Game.rooms[roomName].memory as RoomMemory;
    const settings = roomMem.settingsMap[energyLevel];
    const currentRUCount = utils.creepCountAllRooms(CreepRole.ROLE_REMOTE_UPGRADER);
    //console.log("current Remote Upgrader Count: " + currentRUCount)
    if (miners < settings.minersPerSource * 2
      || workers < settings.maxWorkerCount
      || carriers < settings.maxCarrierCount) return;

    var flags = _.filter(Game.flags, f => f.color == COLOR_BLUE && f.secondaryColor == COLOR_BLUE);
    if (flags.length == 0) return;
    const spawns = utils.findSpawns(roomName);
    let remoteUpgradersNeeded: number = 3 - currentRUCount;
    let spawned: number = 0;
    _.each(spawns, (spawn) => {
      if (spawned < remoteUpgradersNeeded) {
        let spawner = spawn as StructureSpawn;
        if (CreepManager.trySpawnCreep(spawner, CreepRole.ROLE_REMOTE_UPGRADER, energyLevel)) {
          spawned++;
        }
      }
    })
  }
  static spawnMissingDefenders(roomName: string, energyLevel: number) {
    //const miners = utils.creepCount(roomName, CreepRole.ROLE_MINER);
    //const workers = utils.creepCount(roomName, CreepRole.ROLE_WORKER);
    //const carriers = utils.creepCount(roomName, CreepRole.ROLE_CARRIER);
    //const upgraders = utils.creepCount(roomName, CreepRole.ROLE_UPGRADER);
    //const roomMem = Game.rooms[roomName].memory as RoomMemory;
    //const settings = roomMem.settingsMap[energyLevel];
    const currentDefenderCount = utils.creepCountAllRooms(CreepRole.ROLE_DEFENDER);
    ////console.log("current Remote Upgrader Count: " + currentRUCount)
    //if (miners < settings.minersPerSource * 2
    //  || workers < settings.maxWorkerCount
    //  || carriers < settings.maxCarrierCount) return;
    const spawns = utils.findSpawns(roomName);
    let defendersNeeded: number = 3 - currentDefenderCount;
    let spawned: number = 0;
    _.each(spawns, (spawn) => {
      if (spawned < defendersNeeded) {
        let spawner = spawn as StructureSpawn;
        if (CreepManager.trySpawnCreep(spawner, CreepRole.ROLE_DEFENDER, energyLevel)) {
          spawned++;
        }
      }
    })
   
  }
  static spawnMissingScouts(roomName: string, energyLevel: number): void {
    const miners = utils.creepCount(roomName, CreepRole.ROLE_MINER);
    const workers = utils.creepCount(roomName, CreepRole.ROLE_WORKER);
    const upgraders = utils.creepCount(roomName, CreepRole.ROLE_UPGRADER);
    const carriers = utils.creepCount(roomName, CreepRole.ROLE_CARRIER);
    const roomMem = Game.rooms[roomName].memory as RoomMemory;
    const settings = roomMem.settingsMap[energyLevel];
    const currentScoutCount = utils.creepCountAllRooms(CreepRole.ROLE_SCOUT);
    if (miners < settings.minimumMinerCount
      || workers < settings.maxWorkerCount
      || miners < settings.minimumMinerCount
      || carriers < settings.maxCarrierCount) return;

    const spawns = utils.findSpawns(roomName);
    //console.log("spawning scout?")
    let scoutsNeeded: number = 1 - currentScoutCount;
    //console.log("spawning " + scoutsNeeded + " scouts")
    if (scoutsNeeded === 0) return;

    //let scoutsSpawned: number = 0;
    //_.each(spawns, (spawn) => {
    //  if (scoutsSpawned < scoutsNeeded) {
    //    let spawner = spawn as StructureSpawn;
    //    if (CreepManager.trySpawnCreep(spawner, CreepRole.ROLE_SCOUT, energyLevel)) {
    //      scoutsSpawned++;
    //    }
    //  }
    //})

  }
  private static spawnMissingWorkers(roomName: string, energyLevel: number) {
    const miners = utils.creepCount(roomName, CreepRole.ROLE_MINER);
    const carriers = utils.creepCount(roomName, CreepRole.ROLE_CARRIER);
    const upgraders = utils.creepCount(roomName, CreepRole.ROLE_UPGRADER);
    const roomMem = Game.rooms[roomName].memory as RoomMemory;
    const settings = roomMem.settingsMap[energyLevel];
    const currentWorkerCount = utils.creepCount(roomName, CreepRole.ROLE_WORKER);
    if (miners < settings.minimumMinerCount - 1 && currentWorkerCount > 0) {
      //console.log("skipping workers for now.")
      return;
    }
    if (carriers < settings.minimumCarrierCount || upgraders < settings.maxUpgraderCount) return;

    const spawns = utils.findSpawns(roomName);

    let workersNeeded: number = settings.maxWorkerCount - currentWorkerCount;
    if (workersNeeded === 0) return;

    let workersSpawned: number = 0;
    _.each(spawns, (spawn) => {
      if (workersSpawned < workersNeeded) {
        let spawner = spawn as StructureSpawn;
        if (CreepManager.trySpawnCreep(spawner, CreepRole.ROLE_WORKER, energyLevel)) {
          workersSpawned++;
        }
      }
    })
  }

  private static spawnMissingCarriers(roomName: string, energyLevel: number) {
    const miners = utils.creepCount(roomName, CreepRole.ROLE_MINER);
    const workers = utils.creepCount(roomName, CreepRole.ROLE_WORKER);
    const roomMem = Game.rooms[roomName].memory as RoomMemory;
    const settings = roomMem.settingsMap[energyLevel];
    const currentCarrierCount = utils.creepCount(roomName, CreepRole.ROLE_CARRIER);
    if (miners < settings.minimumMinerCount - 1 && workers < settings.minimumWorkerCount && currentCarrierCount > 0) {
      console.log("skipping carriers for now.")
      return;
    }
    const spawns = utils.findSpawns(roomName);

    let needed: number = settings.maxCarrierCount - currentCarrierCount;
    if (needed === 0) return;

    let spawned: number = 0;
    _.each(spawns, (spawn) => {
      if (spawned < needed) {
        let spawner = spawn as StructureSpawn;
        if (CreepManager.trySpawnCreep(spawner, CreepRole.ROLE_CARRIER, energyLevel)) {
          spawned++;
        }
      }
    })
  }
  private static spawnMissingUpgraders(roomName: string, energyLevel: number) {
    const roomMem = Game.rooms[roomName].memory as RoomMemory;
    const settings = roomMem.settingsMap[energyLevel];
    const workers = utils.creepCount(roomName, CreepRole.ROLE_WORKER);
    const carriers = utils.creepCount(roomName, CreepRole.ROLE_CARRIER);
    //if (workers < settings.minimumWorkerCount + 1) return;
    const miners = utils.creepCount(roomName, CreepRole.ROLE_MINER);
    if (miners < settings.minimumMinerCount) return;
    if (carriers < settings.minimumCarrierCount) return;
    //if (workers < settings.minimumWorkerCount) return;
    //console.log("upgrader")
    const spawns = utils.findSpawns(roomName);
    let currentCount = utils.creepCount(roomName, CreepRole.ROLE_UPGRADER);

    let needed: number = settings.maxUpgraderCount - currentCount;
    if (needed === 0) return;

    let spawned: number = 0;
    _.each(spawns, (spawn) => {
      if (spawned < needed) {
        let spawner = spawn as StructureSpawn;
        if (CreepManager.trySpawnCreep(spawner, CreepRole.ROLE_UPGRADER, energyLevel)) {
          spawned++;
        }
      }
    })
  }
  private static spawnMissingMiners(roomName: string, energyLevel: number) {
    //console.log("spawning miners")
    const roomMem = Game.rooms[roomName].memory as RoomMemory;
    const settings = roomMem.settingsMap[energyLevel];
    const spawns = utils.findSpawns(roomName);
    const currentMinerCount = utils.creepCount(roomName, CreepRole.ROLE_MINER);

    const room = Game.rooms[roomName]
    const sources = room.find(FIND_SOURCES);

    const minerCount = sources.length * settings.minersPerSource;
    //console.log("miner count: " + minerCount)
    const minersNeeded: number = minerCount - currentMinerCount
    // console.log("Miners needed: " + minersNeeded)
    if (minersNeeded === 0) return;
    let minersSpawned: number = 0;
    _.each(spawns, (spawn) => {
      if (minersSpawned < minersNeeded) {
        let spawner = spawn as StructureSpawn;
        //console.log("spawning miner!")
        if (CreepManager.trySpawnCreep(spawner, CreepRole.ROLE_MINER, energyLevel)) {
          minersSpawned++;
        }
      }
    })
  }

  private static spawnCreep(spawn: StructureSpawn, bodyParts: BodyPartConstant[], role: CreepRole): number {
    //console.log("trying to spawn " + getRoleString(role))
    let uuid: number = Memory.uuid;
    let creepName: string = spawn.room.name + "-" + utils.getRoleString(role) + "-" + (uuid + 1);
    let status: number | string = spawn.spawnCreep(bodyParts, creepName, { dryRun: true });
    status = _.isString(status) ? OK : status;

    while (status == -3) {
      uuid++;
      creepName = spawn.room.name + "-" + utils.getRoleString(role) + "-" + (uuid + 1);
      status = spawn.spawnCreep(bodyParts, creepName, { dryRun: true });
      status = _.isString(status) ? OK : status;
    }

    if (status === OK && spawn.spawning == null) {
      Memory.uuid = uuid + 1;
      const creepName: string = spawn.room.name + "-" + utils.getRoleString(role) + "-" + uuid;

      const memory: CreepMemory =
      {
        spawnID: spawn.id,
        idle: true,
        currentTask: "",
        alive: true,
        role: role
      };

      console.log("Started creating new creep: " + creepName);

      status = spawn.spawnCreep(bodyParts, creepName, { memory: memory });

      return _.isString(status) ? OK : status;
    }
    else {
      //console.log("Coudldn't spawn: " + Utils.errorToString(status))
      // if (Config.ENABLE_DEBUG_MODE && status !== ERR_NOT_ENOUGH_ENERGY)
      // {
      // 	log.info("Failed creating new creep: " + status);
      // }

      return status;
    }
  }
}
