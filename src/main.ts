import { ErrorMapper } from "utils/ErrorMapper";
import { RoomManager } from "roomManager";
import * as MemUtils from "utils/memory"

const rm = new RoomManager();
let initialized = false;
function memoryInit() {

  console.log("Initializing Game");
  delete Memory.flags;
  delete Memory.spawns;
  delete Memory.creeps;
  delete Memory.rooms;

  const mem = Memory;
  mem.creeps = {};
  mem.rooms = {};
  mem.spawns = {};
  mem.flags = {};

  mem.uuid = getTotalCreepCount();
  mem.memVersion = MemUtils.MemoryVersion;
}
function getTotalCreepCount(): number {
  let totalcreepCount = 0;
  for (const i in Game.rooms) {
    const room: Room = Game.rooms[i];
    let creeps = room.find(FIND_MY_CREEPS);
    totalcreepCount += creeps.length;
  }
  return totalcreepCount;
}
function InitializeGame() {
  if (Memory.memVersion === undefined ||
    Memory.memVersion !== MemUtils.MemoryVersion ||
    (Memory.memVersion == 0 && !initialized)) {
    initialized = true;
    memoryInit();
  }
  if (!Memory.uuid || Memory.uuid > 10000) {
    Memory.uuid = getTotalCreepCount();
  }
  InitializeRoomMemory();
}
function InitializeRoomMemory() {
  for (var i in Game.rooms) {
    const room: Room = Game.rooms[i];
    let roomMemory = Memory.rooms[room.name];
    if (roomMemory === undefined || roomMemory.pendingWorkerRequests == undefined) {
      console.log(`Init room memory for ${room.name}.`);
      Memory.rooms[room.name] = {} as RoomMemory;
      MemUtils.initRoomMemory(room.name);
      roomMemory = Memory.rooms[room.name];
    }
  }
}
function mainLoop() {
  InitializeGame();

  for (const i in Game.rooms) {
    const room: Room = Game.rooms[i];
    rm.Run(room.name);
  }

  MemUtils.cleanupCreeps();
}

export const loop = ErrorMapper.wrapLoop(mainLoop);

