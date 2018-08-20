//import { StructureTaskRequest } from "tasks/StructureTaskRequest";
//import { CreepTaskRequest2 } from "tasks/CreepTaskRequest";
//import { StructureTaskRequest } from "tasks/StructureTaskRequest";
import * as utils from "utils/utils";
import { getRoomType } from "utils/utils";
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

    mem.uuid = global.creepManager.totalCreepCount();
    mem.memVersion = MemoryVersion;
    initializeFlags();
}
export function initializeFlags() {
    var flags = Game.flags;
    console.log("found " + Object.keys(flags).length + " flags.")
    for (var id in flags) {
        Memory.flags[id] = flags[id];
        if (Game.rooms[flags[id].pos.roomName] == undefined) {
            initRoomMemory(flags[id].pos.roomName);
        }
    }
}
export function InitializeGame() {
    if (Memory.memVersion === undefined ||
        Memory.memVersion !== MemoryVersion ||
        (Memory.memVersion == 0 && !initialized)) {

        memoryInit();
        initialized = true;
    }
    if (!Memory.uuid || Memory.uuid > 10000) {
        Memory.uuid = global.creepManager.totalCreepCount();
    }
    InitializeRoomMemory();
}
export function InitializeRoomMemory() {
    for (var i in Game.rooms) {
        const room: Room = Game.rooms[i];
        let roomMemory = Memory.rooms[room.name];
        if (roomMemory === undefined || roomMemory.initialized === false) {
            initRoomMemory(room.name);
        }
    }
}
export function initRoomMemory(roomName: string): void {
    console.log(`Init room memory for ${roomName}.`);

    var roomType = getRoomType(roomName);

    switch (roomType) {
        case "OWNED":
            const ownedMem = <OwnedRoomMemory>{};
            ownedMem.settingsMap = SetupRoomSettings(roomName)
            var s = new utils.Search2();
            ownedMem.baseEntranceRamparts = s.findEntrances(roomName, "rampart");
            ownedMem.baseEntranceWalls = s.findEntrances(roomName, "constructedWall");
            ownedMem.initialized = true;
            ownedMem.structures = {};
            ownedMem.avoid = false;
            ownedMem.activeResourcePileIDs = [];
            ownedMem.roomType = roomType;
            Memory.rooms[roomName] = ownedMem
            break;
        case "REMOTE_HARVEST":
            const remoteMem = <RemoteHarvestRoomMemory>{};
            remoteMem.roomType = roomType;
            var flag = _.find(Memory.flags, f => f.pos.roomName == roomName && f.color == COLOR_BLUE && f.secondaryColor == COLOR_WHITE);
            if (flag == undefined) throw new Error("Flag cannot be undefined at this stage...");
            remoteMem.baseRoomName = flag.name;
            remoteMem.assignedReserver = "";
            remoteMem.sourceCount = 0;
            remoteMem.activeResourcePileIDs = [];
            remoteMem.initialized = true;
            Memory.rooms[roomName] = remoteMem;
            break;
    }

    //need different room memory types for different room types!!
    //const rm = <OwnedRoomMemory>{};
    //rm.roomType = getRoomType(roomName);
    //rm.structures = {};
    //rm.activeResourcePileIDs = [];
    //rm.settingsMap = SetupRoomSettings(roomName);
    //let start = Game.cpu.getUsed()
    //var s = new utils.Search2();
    //rm.baseEntranceRamparts = s.findEntrances(roomName, "rampart");
    //rm.baseEntranceWalls = s.findEntrances(roomName, "constructedWall");
    //console.log("CPU USAGE: " + (Game.cpu.getUsed() - start))
    //rm.initialized = true;
    //Memory.rooms[roomName] = rm;

}
interface RoomSettingsMap {
    [energyLevel: number]: RoomSettings;
}
export function SetupRoomSettings(roomName: string): RoomSettingsMap {
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
    level4Settings.maxCarrierCount = 2;
    level4Settings.maxUpgraderCount = 3;
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
            global.creepManager.deleteCreep(creepName)
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

