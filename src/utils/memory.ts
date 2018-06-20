//import { StructureTaskRequest } from "tasks/StructureTaskRequest";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepRole } from "utils/utils";
import { StructureTaskRequest } from "tasks/StructureTaskRequest";

export const MemoryVersion = 0;
export function m(): GameMemory {
  return Memory as any as GameMemory;
}
export interface GameMemory {
  uuid: number;
  memVersion: number;
  initialized: boolean;
  creeps:
  {
    [name: string]: any;
  };

  flags:
  {
    [name: string]: any;
  };

  rooms:
  {
    [name: string]: RoomMemory;
  };

  spawns:
  {
    [name: string]: any;
  };
}


export interface RoomMemory {
  harvestLocations: { [index: string]: SmartSource };
  activeWorkerRequests: { [index: string]: CreepTaskRequest };
  test: StructureContainer[];
  pendingWorkerRequests: CreepTaskRequest[];
  pendingStructureRequests: StructureTaskRequest[];
  activeStructureRequests: { [index: string]: StructureTaskRequest };
  activeResourcePileIDs: string[];
  smartStructures: SmartStructure[];
}
export interface StructureMemory {
  idle: boolean;
  alive: boolean;
  currentTask: string;

}
export function initRoomMemory(roomName: string): void {
  let room = Game.rooms[roomName];
  const rm: RoomMemory = m().rooms[room.name];
  rm.harvestLocations = {};
  rm.test = [];
  rm.activeWorkerRequests = {};
  rm.pendingWorkerRequests = [];
  rm.activeResourcePileIDs = [];
  rm.activeStructureRequests = {};
  rm.pendingStructureRequests = []
  rm.smartStructures = [];

}
export interface SmartStructure {
  memory: StructureMemory;
  id: string;
}

export interface CreepMemory {
  spawnID: string;
  alive: boolean | undefined;
  currentTask: string;
  idle: boolean;
  role: CreepRole
}
export function cleanupCreeps(): void {
  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      console.log("Clearing dead creeps from memory.")
      for (const roomName in Game.rooms) {
        let room = Game.rooms[roomName] as Room;
        let roomMemory = room.memory as RoomMemory;
        let sites = roomMemory.harvestLocations;
        for (const sourceID in sites) {
          let site = sites[sourceID];
          if (_.includes(site.assignedTo, name)) {
            console.log("unassiging harvest spot for " + name + " source: " + site.sourceID)
            site.assignedTo = site.assignedTo.filter(s=>s!=name);
            console.log(JSON.stringify(site.assignedTo))
          }
        }
      }
      delete Memory.creeps[name];
    }
  }
}
export class SmartSource {
  sourceID: string;
  roomName: string;
  assignedTo: string[] = [];
  constructor(sourceID: string, roomName: string) {
    this.sourceID = sourceID;
    this.roomName = roomName;
  }
}


