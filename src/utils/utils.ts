import { Traveler } from "Traveler";
import { roomManager } from "RoomManager";

export function initializeFlags(roomName: string) {
  let room = Game.rooms[roomName];
  var flags = room.find(FIND_FLAGS);
  console.log("found " + flags.length + " flags.")
  for (var id in flags) {
    Memory.flags[id] = flags[id];
  }
  
  //m().flags = room.find(FIND_FLAGS);
}

export function closestOwnedRoom(targetRoomName: string): string {

  const ownedRooms = _.filter(Memory.rooms, room => room.roomType === "OWNED");
  let min = 99;
  let winner = "";
  for (var roomName in ownedRooms) {
    var distance = Traveler.findRoute(roomName, targetRoomName);
    if (distance != undefined && Object.keys(distance).length < min) {
      min = Object.keys(distance).length;
      winner = roomName;
    }
  }
  return winner;
}

export function findFlags(roomName: string | undefined, primaryColor: ColorConstant | undefined = undefined, flagName: string | undefined = undefined): Flag[] {

  const found: Flag[] = [];
  const flags = Game.flags;
  for (const id in flags) {
    const flag = flags[id];
    if ((flag.pos.roomName == roomName || roomName == undefined)
      && (flag.color == primaryColor || primaryColor == undefined)
      && (flag.name == flagName || flagName == undefined))

      found.push(flag);
  }
  return found;
}

export function uniqueID () {
  // Math.random should be unique because of its seeding algorithm.
  // Convert it to base 36 (numbers + letters), and grab the first 9 characters
  // after the decimal.
  return '_' + Math.random().toString(36).substr(2, 9);
};
export class Search2 {

  constructor() { }
  private toFind: BaseEdge = "rampart";
  
  private roomMatrix = new PathFinder.CostMatrix();
  private outerRampartsAndWalls: { [friendlyCoords: string]: string } = {};

  private getRoomPosition(roomName: string, friendly: string): RoomPosition {
    var split = friendly.split(",");
    return new RoomPosition(Number(split[0]), Number(split[1]), roomName);
  }

  //public findBaseArea(roomName: string): RoomPosition[] {
  //  var room = Game.rooms[roomName];
  //  if (room == undefined) throw Error("Cant get neighbors on a non-visible room...");

  //  this.initialize(roomName);


  //}
  private initialize(roomName: string) {

    var room = Game.rooms[roomName];
    if (room == undefined) throw Error("Cant get neighbors on a non-visible room...");
    this.roomMatrix = new PathFinder.CostMatrix();

    for (let i = 0; i < 50; i++) {
      for (let j = 0; j < 50; j++) {
        this.roomMatrix.set(i, j, Game.map.getTerrainAt(i, j, roomName) == "wall" ? 1 : 0);
      }
    }

  }
  public findEntrances(roomName: string, toFind: BaseEdge): RoomPosition[] {

    this.toFind = toFind;
    var room = Game.rooms[roomName];
    if (room == undefined) throw Error("Cant get neighbors on a non-visible room...");

    this.initialize(roomName);

    var rampartsAndWalls = room.find(FIND_STRUCTURES).filter(s => s != undefined && (s.structureType == "rampart" || s.structureType == "constructedWall"));
    for (let id in rampartsAndWalls) {
      let r = rampartsAndWalls[id] as AnyStructure;
      this.roomMatrix.set(r.pos.x, r.pos.y, r.structureType == "constructedWall" ? 2 : 3);
    }

    //flood from every entry point in room until no unvisited nodes
    for (let i = 0; i < 50; i++) {

      if (this.roomMatrix.get(0,i) == 0) {
        this.floodFill(0, i);
      }
      if (this.roomMatrix.get(49,i) == 0) {
        this.floodFill(49, i);
      }
      if (this.roomMatrix.get(i,0) == 0) {
        this.floodFill(i, 0);
      }
      if (this.roomMatrix.get(i,49) == 0) {
        this.floodFill(i, 49);
      }

    }

    let foundEdges: RoomPosition[] = [];
    for (var i in this.outerRampartsAndWalls) {
      var thing = this.outerRampartsAndWalls[i] as BaseEdge;
      if (thing == toFind)
        foundEdges.push(this.getRoomPosition(roomName, i));
    }
    return foundEdges;
  }

  private floodFill(i: number, j: number) {

    if (this.roomMatrix.get(i, j) == 0) {
      this.roomMatrix.set(i, j, 1);
      for (let x = -1; x <= 1; x++) {
        if (i + x < 0 || i + x >= 50) continue;
        for (let y = -1; y <= 1; y++) {
          if (j + y < 0 || j + y >= 50) continue;
          if (x == 0 && y == 0) continue;
          this.floodFill(i + x, j + y);
        }
      }
    }
    else if (this.roomMatrix.get(i, j) == 2) {
      this.roomMatrix.set(i, j, 4);
      //console.log("found wall");
      this.outerRampartsAndWalls[`${i},${j}`] = "constructedWall";
    }
    else if (this.roomMatrix.get(i, j) == 3) {
      this.roomMatrix.set(i, j, 4);
      //console.log("found rampart");
      this.outerRampartsAndWalls[`${i},${j}`] = "rampart";
    }

  }
}

class Queue<T> {
  _store: T[] = [];
  length(): number { return this._store.length }
  push(val: T) {
    this._store.push(val);
  }
  pop(): T | undefined {
    return this._store.shift();
  }
}

export function findIdleCreeps(homeRoomName: string, role: CreepRole ="ROLE_ALL"): Creep[] {

  var creeps = Game.creeps;
  var idle : Creep[] = []
  for (var i in creeps) {
    var creep = creeps[i] as Creep;
    if (creep.memory.homeRoom != homeRoomName) continue;
    if (!creep.memory.idle) continue;
    if (creep.memory.role != role && role !="ROLE_ALL") continue;
    idle.push(creep);
  }
  return idle;

}
export function findIdleStructures(roomName: string, type?: StructureConstant|undefined): string[] {

  const room = Game.rooms[roomName];
  if (room == undefined) return [];
  var test = _.filter(room.memory.structures, s => s.currentTask == "" && (type == undefined || s.type == type));
  return _.map(test, s => s.id);
}
export function idleCreepCount(roomName: string, role: CreepRole ="ROLE_ALL") {
  return findIdleCreeps(roomName, role).length;
}
export function findClosestContainer(roomName: string, targetID: string, fullOK: boolean, emptyOK: boolean): StructureContainer | undefined {
  let target = Game.getObjectById(targetID);
  if (target == null) {
    //console.log("container target was null.")
    return;
  }
  let roomContainers = findAllContainers(roomName)
    .sort((a, b) => a.pos.getRangeTo(target as any) - b.pos.getRangeTo(target as any));

  for (const id in roomContainers) {
    let container = <StructureContainer>Game.getObjectById(id);
    if (container == null) continue;
    if (!fullOK && container.store.energy == container.storeCapacity) continue; //has room
    if (!emptyOK && container.store.energy == 0) continue; //can't be empty
    return container;
  }
  return undefined;
}
export function creepIDsByRole(roomName: string, role: CreepRole): string[] {
  let room = Game.rooms[roomName];
  let creeps = room.find(FIND_MY_CREEPS) as Creep[];
  let found: string[] = [];
  for (const key in creeps) {
    if (creeps.hasOwnProperty(key)) {
      const creep = creeps[key];
      const mem = creep.memory as CreepMemory;
      if (mem.role == role || role == undefined) found.push(creep.id);
    }
  }
  return found;
}
export function creepNamesByRole(roomName: string, role: CreepRole): string[] {
  let room = Game.rooms[roomName];
  let creeps = room.find(FIND_MY_CREEPS) as Creep[];
  let found: string[] = [];
  for (const key in creeps) {
    if (creeps.hasOwnProperty(key)) {
      const creep = creeps[key];
      const mem = creep.memory as CreepMemory;
      if (mem.role == role || role == undefined) found.push(creep.name);
    }
  }
  return found;
}
export function creepCount(roomName: string, role: CreepRole | undefined): number {
  let room = Game.rooms[roomName];
  if (room == undefined) return 0;
  let creeps = room.find(FIND_MY_CREEPS) as Creep[];
  if (role == undefined) return creeps.length;
  else {
    return creepIDsByRole(roomName, role).length
  }
}
export function creepCountAllRooms(role: CreepRole): number {
  var count = 0;
  let rooms = Game.rooms;
  for (var id in rooms) {
    var room = rooms[id];
    let creeps = room.find(FIND_MY_CREEPS) as Creep[];
    count += creepIDsByRole(room.name, role).length;
  }
  return count;
}
export function roomSources(roomName: string): Source[] {
  return Game.rooms[roomName].find(FIND_SOURCES) as Source[];
}
export function sourceCount(roomName: string) {
  return roomSources(roomName).length;
}
export function findAllContainers(roomName: string): ContainerMemory[] {

  return roomManager.getContainers2(roomName);
  //return Game.rooms[roomName].find(FIND_STRUCTURES).filter(i => {
  //  return i.structureType == STRUCTURE_CONTAINER;
  //}) as StructureContainer[];

}
export function findClosestContainerID(roomName: string, creepRole: CreepRole, energyAmount: number, targetID: string) : string | undefined {

  var containerIDs = findContainers(roomName, creepRole, energyAmount, targetID);
  if (containerIDs.length == 0) return undefined;
  else return containerIDs[0];

}
export function getRoomEnergyLevel(roomName: string): number {

  //var roomCreeps = _.filter(Game.creeps, c => c.memory.homeRoom = roomName)
  var room = Game.rooms[roomName];
  var creeps = room.find(FIND_MY_CREEPS);

  if (creeps.length < 3 && room.energyAvailable < 800) return 1;

  let cap = room.energyCapacityAvailable;

  if (cap < 550) return 1;
  else if (cap <= 950) return 2;
  else if (cap <= 1500) return 3;
  else if (cap <= 3500) return 4;
  else return 5;
}
export function findClosestSourceID(roomName: string, targetPos: RoomPosition, energyAmount: number = 0) : string | undefined{

  var sources = roomManager.getSources2(roomName);
  var withEnergy2: Source[] = [];

  _.forEach(sources, sourceMem => {
    var source = <Source>Game.getObjectById(sourceMem.id);
    if (source.energy > energyAmount) withEnergy2.push(source);
  })
  return _.min(withEnergy2, source => targetPos.getRangeTo(source)).id
}
export function getRoomType(roomName: string): RoomType {
  if (Memory.rooms[roomName] != undefined) return Memory.rooms[roomName].roomType;

  const room = Game.rooms[roomName];
  if (room == undefined) return "UNKNOWN";

  if (room.controller != undefined) {
    if (room.controller.my) {
      if (room.find(FIND_SOURCES).length > 0) return "OWNED";
      else return "REMOTE_HARVEST"; //todo - handle expansion case
    }
    else return "HOSTILE"; //todo - add in friendly folks
  }
  else {
    if (room.find(FIND_HOSTILE_SPAWNS).length > 0) return "SOURCE_KEEPER";
    else return "EMPTY"
  }

  //todo - refactor this?
}
export function findContainers(roomName: string, creepRole:CreepRole, energyAmount:number, sortByRangeToID: string = "") : string[] {


  var room = Game.rooms[roomName];
  if (room == undefined) return [];
  var containers = findAllContainers(roomName);
  
  var filtered = _.filter(containers, c =>
    _.includes(<CreepRole[]>c.allowedWithdrawRoles, creepRole)
    && (<StructureContainer>Game.getObjectById(c.id)).store.energy > energyAmount);

  if (sortByRangeToID != "") {
    var rangeToTarget = <RangeTarget>Game.getObjectById(sortByRangeToID);
    if (rangeToTarget == undefined) throw new Error("findContainers:rangeToTarget cannot be undefined");

    var sorted = _.sortBy(filtered, c => c.pos.getRangeTo(rangeToTarget))
    return _.map(sorted, s=>s.id);
  }
  else return _.map(filtered, f=>f.id);

}

export function findSpawns(roomName: string, onlyNonSpawning: boolean = true) {
  let room = Game.rooms[roomName];
  return room.find(FIND_MY_STRUCTURES, {
    filter: (structure: Structure) => {
      if (structure.structureType == STRUCTURE_SPAWN) {
        let spawner = structure as StructureSpawn;
        Memory.spawns[spawner.id] = spawner.memory
        return onlyNonSpawning ? spawner.spawning === null : true;
      }
      return false;
    }
  });
}
export function getTotalCreepCount(): number {
  let totalcreepCount = 0;
  for (const i in Game.rooms) {
    const room: Room = Game.rooms[i];
    let creeps = room.find(FIND_MY_CREEPS);
    totalcreepCount += creeps.length;
  }
  return totalcreepCount;
}
export function getRestockables(roomName: string): Array<AnyStructure> {
  let room = Game.rooms[roomName];
  return room.find(FIND_STRUCTURES, {
    filter: (structure) => {
      return (structure.structureType == STRUCTURE_EXTENSION
        || structure.structureType == STRUCTURE_SPAWN)
        && structure.energy < structure.energyCapacity;
    }
  });
}

export function getRole(creepName: string): CreepRole {

  if (creepName.search("ROLE_MINER") != -1) return "ROLE_MINER";
  if (creepName.search("ROLE_WORKER") != -1) return "ROLE_WORKER";
  if (creepName.search("ROLE_UPGRADER") != -1) return "ROLE_UPGRADER";
  if (creepName.search("ROLE_CARRIER") != -1) return "ROLE_CARRIER";
  if (creepName.search("ROLE_SCOUT") != -1) return "ROLE_SCOUT";
  if (creepName.search("ROLE_REMOTE_UPGRADER") != -1) return "ROLE_REMOTE_UPGRADER";
  if (creepName.search("ROLE_DEFENDER") != -1) return "ROLE_DEFENDER";
  if (creepName.search("ROLE_DISMANTLER") != -1) return "ROLE_DISMANTLER";
  if (creepName.search("unknown role") != -1) return "ROLE_DISMANTLER";
  return"ROLE_UNASSIGNED";
}
export function getHomeRoom(creepName: string): string {

  return creepName.split("-")[0];
}
export enum CantBuildReasons {
  NotTheOwner = -1,
  NameAlreadyExists = -3,
  BuildingBusy = -4,
  NotEnoughEnergy = -6,
  InvalidArguments = -10,
  RCLNotHighEnough = -14

}

export function errorToString(job: CantBuildReasons): string {
  switch (job) {
    case CantBuildReasons.NotTheOwner: return "You don't own this building...?";
    case CantBuildReasons.NameAlreadyExists: return "Name already exists...";
    case CantBuildReasons.BuildingBusy: return "Name already exists...";
    case CantBuildReasons.NotEnoughEnergy: return "You can't afford it!";
    case CantBuildReasons.InvalidArguments: return "Invalid arguments passed to spawnCreep";
    case CantBuildReasons.RCLNotHighEnough: return "Your RCL level is not high enough";
    default: return "unknown error";
  }
}



