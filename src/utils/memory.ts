//import { StructureTaskRequest } from "tasks/StructureTaskRequest";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { StructureTaskRequest } from "tasks/StructureTaskRequest";
import * as utils from "utils/utils";
export const MemoryVersion = 0;
//export function m(): GameMemory {
//  return Memory as any as GameMemory;
//}
//export interface GameMemory {
//  uuid: number;
//  memVersion: number;
//  gcl: any;
//  map: any;
//  initialized: boolean;
//  creeps:
//  {
//    [name: string]: any;
//  };

//  flags:
//  {
//    [name: string]: any;
//  };

//  rooms:
//  {
//    [name: string]: RoomMemory;
//  };

//  spawns:
//  {
//    [name: string]: any;
//  };
//}

//export enum CreepRole {
//  ROLE_UNASSIGNED = 0,
//  ROLE_ALL = 1,
//  ROLE_MINER = 2,
//  ROLE_WORKER = 3,
//  ROLE_UPGRADER = 4,
//  ROLE_SCOUT = 5,
//  ROLE_CARRIER = 6,
//  ROLE_REMOTE_UPGRADER = 7,
//  ROLE_DEFENDER = 8
//}
//export enum TaskStatus {
//  PENDING = 0,
//  INIT = 1,
//  PREPARE = 2,
//  PRE_RUN = 3,
//  IN_PROGRESS = 4,
//  POST_RUN = 5,
//  FINISHED = 6,
//}
//export enum LinkMode {
//  SEND = 0, MASTER_RECEIVE = 1, SLAVE_RECEIVE = 2
//}

//interface RoomMemory {
//  harvestLocations: { [index: string]: SmartSource };
//  activeWorkerRequests: { [index: string]: CreepTaskRequest };
//  test: StructureContainer[];
//  pendingWorkerRequests: CreepTaskRequest[];
//  pendingStructureRequests: StructureTaskRequest[];
//  activeStructureRequests: { [index: string]: StructureTaskRequest };
//  containers: {[index:string]:SmartContainer}
//  links: {[index:string]:SmartLink}
//  //activeResourcePileIDs: string[];
//  towers: { [id: string]: SmartStructure };
//  settingsMap: { [energyLevel: number]: RoomSettings };
//  //avoid: any;
//}

export function initRoomMemory(roomName: string): void {
  let room = Game.rooms[roomName];
  const rm: RoomMemory = Memory.rooms[room.name];
  rm.harvestLocations = {};
  rm.test = [];
  rm.activeWorkerRequests = {};
  rm.pendingWorkerRequests = [];
  rm.activeResourcePileIDs = [];
  rm.activeStructureRequests = {};
  rm.pendingStructureRequests = []
  rm.towers = {};
  rm.containers = {};
  rm.links = {};
  rm.settingsMap = SetupRoomSettings(roomName);
  rm.baseEntranceRamparts = [];
  let start = Game.cpu.getUsed()
  var s = new utils.Search2(roomName);
  rm.baseEntranceRamparts = s.findEntrances("rampart");
  rm.baseEntranceWalls = s.findEntrances("constructedWall");
  console.log("CPU USAGE: " + (Game.cpu.getUsed() - start))
}
interface RoomSettingsMap {
  [energyLevel: number]: RoomSettings;
}
export function SetupRoomSettings(roomName: string) : RoomSettingsMap
{
  const settingsMap: RoomSettingsMap = {};
  var level1Settings = new RoomSettings(roomName);
  level1Settings.minersPerSource = 2;
  level1Settings.maxWorkerCount = 4;
  level1Settings.maxUpgraderCount = 3;
  settingsMap[1] = level1Settings;

  var level2Settings = new RoomSettings(roomName);
  level2Settings.minersPerSource = 2
  level2Settings.maxUpgraderCount = 4;
  level2Settings.maxWorkerCount = 3;
  settingsMap[2] = level2Settings;

  var level3Settings = new RoomSettings(roomName);
  level3Settings.minersPerSource = 1;
  level3Settings.maxCarrierCount = 2;
  level3Settings.maxUpgraderCount = 2;
  settingsMap[3] = level3Settings;

  var level4Settings = new RoomSettings(roomName);
  level4Settings.minersPerSource = 1;
  level4Settings.maxCarrierCount = 2;
  level4Settings.maxUpgraderCount = 3;
  settingsMap[4] = level4Settings;


  var level5Settings = new RoomSettings(roomName);
  level5Settings.minersPerSource = 1;
  level5Settings.maxCarrierCount = 1;
  level5Settings.maxUpgraderCount = 1;
  settingsMap[5] = level5Settings;

  return settingsMap;
}


export function cleanupCreeps(): void {
  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      console.log("Clearing dead creeps from memory.")
      for (const roomName in Game.rooms) {
        //let room = Game.rooms[roomName] as Room;
        //let roomMemory = room.memory as RoomMemory;
        //room.memory.
        let harvestLocations = Game.rooms[roomName].memory.harvestLocations;
        for (const sourceID in harvestLocations) {
          let harvestSpot = harvestLocations[sourceID];
          if (_.includes(harvestSpot.assignedTo, name)) {
            console.log("unassiging harvest spot for " + name + " source: " + harvestSpot.sourceID)
            harvestSpot.assignedTo = harvestSpot.assignedTo.filter(s=>s!=name);
            //console.log(JSON.stringify(site.assignedTo))
          }
        }
      }
      delete Memory.creeps[name];
    }
  }
}




export class SmartContainer {
  containerID: string;
  roomName: string;
  shouldFill: boolean;
  allowedWithdrawRoles: CreepRole[];
  constructor(roomName: string, containerID: string, shouldFill: boolean, allowedWithdrawRoles: CreepRole[]) {
    this.containerID = containerID;
    this.roomName = roomName;
    this.allowedWithdrawRoles = allowedWithdrawRoles;
    this.shouldFill = shouldFill;
  }
}
export class SmartSource {
  sourceID: string;
  roomName: string;
  assignedTo: string[] = [];
  linkID: string = "";
  constructor(sourceID: string, roomName: string) {
    this.sourceID = sourceID;
    this.roomName = roomName;
  }
}

export class SmartLink {
  linkID: string;
  roomName: string;
  linkMode: LinkMode;
  constructor(roomName: string, linkID: string, linkMode: LinkMode = "SEND") {
    this.linkID = linkID;
    this.roomName = roomName;
    this.linkMode = linkMode;
  }
}

export class RoomSettings {
  roomName: string;
  minimumWorkerCount: number = 1;
  //lowLevelMinersPerSource: number = 2;
  //highLevelMinersPerSource: number = 1;
  minersPerSource: number = 2;
  minimumCarrierCount: number = 1;
  maxCarrierCount: number = 3;
  minimumMinerCount: number = 2;
  maxWorkerCount: number = 1;
  maxUpgraderCount: number = 3;
  constructor(roomName: string) { this.roomName = roomName; }
}

