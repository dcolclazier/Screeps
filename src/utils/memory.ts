//import { StructureTaskRequest } from "tasks/StructureTaskRequest";
//import { CreepTaskRequest2 } from "tasks/CreepTaskRequest";
//import { StructureTaskRequest } from "tasks/StructureTaskRequest";
import * as utils from "utils/utils";
import { roomManager } from "RoomManager";
export const MemoryVersion = 0;
export const OwnerName = "KeyserSoze"
let initialized = false;

function memoryInit() {

  console.log("Initializing Game");
  
  delete Memory.flags;
  delete Memory.spawns;
  delete Memory.creeps;
  delete Memory.rooms;

  const mem = Memory;
  mem.owner = OwnerName;
  mem.creeps = {};
  mem.rooms = {};
  mem.spawns = {};
  mem.flags = {};
  mem.scoutTargets = [];
  mem.creepTasks = {};
  mem.structureTasks = {};

  mem.uuid = utils.getTotalCreepCount();
  mem.memVersion = MemoryVersion;
}

export function InitializeGame() {
  if (Memory.memVersion === undefined ||
    Memory.memVersion !== MemoryVersion ||
    (Memory.memVersion == 0 && !initialized)) {

    memoryInit();
    initialized = true;
  }
  if (!Memory.uuid || Memory.uuid > 10000) {
    Memory.uuid = utils.getTotalCreepCount();
  }
  InitializeRoomMemory();
}
export function InitializeRoomMemory() {
  for (var i in Game.rooms) {
    const room: Room = Game.rooms[i];
    let roomMemory = Memory.rooms[room.name];
    if (roomMemory === undefined || roomMemory.initialized === false) {
      

      initRoomMemory(room.name);
      //roomMemory = Memory.rooms[room.name];
    }
  }
}
export function initRoomMemory(roomName: string): void {
  let room = Game.rooms[roomName];
  let rm: RoomMemory = Memory.rooms[room.name];
  console.log(`Init room memory for ${room.name}.`);
  rm = <RoomMemory>{};

  rm.structures = {};

  rm.activeResourcePileIDs = [];

  rm.settingsMap = SetupRoomSettings(roomName);
  
  //let start = Game.cpu.getUsed()
  var s = new utils.Search2();
  rm.baseEntranceRamparts = s.findEntrances(roomName, "rampart");
  rm.baseEntranceWalls = s.findEntrances(roomName, "constructedWall");
  //console.log("CPU USAGE: " + (Game.cpu.getUsed() - start))
  rm.initialized = true;
  Memory.rooms[room.name] = rm;

}
interface RoomSettingsMap {
  [energyLevel: number]: RoomSettings;
}
export function SetupRoomSettings(roomName: string) : RoomSettingsMap
{
  const settingsMap: RoomSettingsMap = {};
  var level1Settings = new RoomSettings(roomName);
  level1Settings.minersPerSource = 2;
  level1Settings.maxWorkerCount = 2;
  level1Settings.maxUpgraderCount = 1;
  settingsMap[1] = level1Settings;

  var level2Settings = new RoomSettings(roomName);
  level2Settings.minersPerSource = 2
  level2Settings.maxUpgraderCount = 4;
  level2Settings.maxWorkerCount = 3;
  settingsMap[2] = level2Settings;

  var level3Settings = new RoomSettings(roomName);
  level3Settings.minersPerSource = 1;
  level3Settings.maxCarrierCount = 2;
  level3Settings.maxUpgraderCount = 1;
  settingsMap[3] = level3Settings;

  var level4Settings = new RoomSettings(roomName);
  level4Settings.minersPerSource = 1;
  level4Settings.maxCarrierCount = 1;
  level4Settings.maxUpgraderCount = 1;
  settingsMap[4] = level4Settings;


  var level5Settings = new RoomSettings(roomName);
  level5Settings.minersPerSource = 1;
  level5Settings.maxCarrierCount = 2;
  level5Settings.maxUpgraderCount = 1;
  settingsMap[5] = level5Settings;

  return settingsMap;
}


export function cleanupCreeps(): void {
  for (const creepName in Memory.creeps) {
    if (!Game.creeps[creepName]) {
      console.log("Clearing dead creeps from memory.")
      for (const roomName in Game.rooms) {
        //let sources = <SourceMemory[]>_.filter(Game.rooms[roomName].memory.structures, s => {
        //  s.type == "source"
        //});
        _.forEach(roomManager.getSources2(roomName), source => {
          console.log(source.assignedTo)
          if (_.includes(source.assignedTo, creepName)) {
            console.log("unassiging harvest spot for " + creepName + " source: " + source)
            source.assignedTo = source.assignedTo.filter(s => s != creepName);
          }
        })
      }
      delete Memory.creeps[creepName];
    }
  }
}

export class RoomSettings {
  roomName: string;
  minimumWorkerCount: number = 1;
  minersPerSource: number = 2;
  minimumCarrierCount: number = 1;
  maxCarrierCount: number = 3;
  minimumMinerCount: number = 2;
  maxWorkerCount: number = 1;
  maxUpgraderCount: number = 3;
  constructor(roomName: string) { this.roomName = roomName; }
}

