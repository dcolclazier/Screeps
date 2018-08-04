
export function findSpawns(roomName: string, onlyNonSpawning: boolean = true) {
  let room = Game.rooms[roomName];
  return room.find(FIND_MY_STRUCTURES, {
    filter: (structure: Structure) => {
      if (structure.structureType == STRUCTURE_SPAWN) {
        let spawner = structure as StructureSpawn;
        Memory.spawns[spawner.id] = spawner
        return onlyNonSpawning ? spawner.spawning === null : true;
      }
      return false;
    }
  });
}
export function findFlags(roomName: string) {
  let room = Game.rooms[roomName];
  var flags = room.find(FIND_FLAGS);
  console.log("found " + flags.length + " flags.")
  for (var id in flags) {
    Memory.flags[id] = flags[id];
  }
  //m().flags = room.find(FIND_FLAGS);
}

export class Search2 {

  constructor(roomName: string) { this._roomName = roomName; }
  private toFind: BaseEdge = "rampart";
  private _roomName: string;
  private floodArray = new PathFinder.CostMatrix();
  private outerRamparts: { [friendlyCoords: string]: string } = {};
  private outerWalls: { [friendlyCoords: string]: string } = {};

  private getRoomPosition(friendly: string): RoomPosition {
    var test = friendly.split(",");
    return new RoomPosition(Number(test[0]), Number(test[1]), this._roomName);
  }
  public findEntrances(toFind: BaseEdge): RoomPosition[] {

    this.toFind = toFind;
    var room = Game.rooms[this._roomName];
    if (room == undefined) throw Error("Cant get neighbors on a non-visible room...");

    var ramparts = room.find(FIND_STRUCTURES).filter(s => s != undefined && s.structureType == "rampart");
    var walls = room.find(FIND_STRUCTURES).filter(s => s != undefined && s.structureType == "constructedWall");

    for (let i = 0; i < 50; i++) {
      for (let j = 0; j < 50; j++) {
        this.floodArray.set(i, j, Game.map.getTerrainAt(i, j, this._roomName) == "wall" ? 1 : 0);
      }
    }
    for (let id in walls) {
      let w = walls[id];
      this.floodArray.set(w.pos.x, w.pos.y, 2);
    }
    for (let id in ramparts) {
      let r = ramparts[id];
      this.floodArray.set(r.pos.x, r.pos.y, 3);
    }
    for (let i = 0; i < 50; i++) {

      if (this.floodArray.get(0,i) == 0) {
        this.floodFill(0, i);
      }
      if (this.floodArray.get(49,i) == 0) {
        this.floodFill(49, i);
      }
      if (this.floodArray.get(i,0) == 0) {
        this.floodFill(i, 0);
      }
      if (this.floodArray.get(i,49) == 0) {
        this.floodFill(i, 49);
      }

    }
    if (toFind == "rampart") {
      let ramparts: RoomPosition[] = [];
      for (var i in this.outerRamparts) {
        ramparts.push(this.getRoomPosition(i));
      }
      return ramparts;

    }
    if (toFind == "constructedWall") {
      let walls: RoomPosition[] = [];
      for (var i in this.outerWalls) {
        walls.push(this.getRoomPosition(i));
      }
      return walls;

    }
    else throw Error("Nope.")
  }

  private floodFill(i: number, j: number) {


    if (this.floodArray.get(i, j) == 0) {
      this.floodArray.set(i, j, 1);
      for (let x = -1; x <= 1; x++) {
        if (i + x < 0 || i + x >= 50) continue;
        for (let y = -1; y <= 1; y++) {
          if (j + y < 0 || j + y >= 50) continue;
          this.floodFill(i + x, j + y);
        }
      }
    }
    else if (this.floodArray.get(i, j) == 2) {
      this.floodArray.set(i, j, 4);
      //console.log("found wall");
      this.outerWalls[`${i},${j}`] = "constructedWall";
    }
    else if (this.floodArray.get(i, j) == 3) {
      this.floodArray.set(i, j, 4);
      //console.log("found rampart");
      this.outerRamparts[`${i},${j}`] = "rampart";
    }

  }
}

export class Search {

  constructor(roomName: string) { this._roomName = roomName; }
  private _roomName: string;
  private visited: { [index: string]: boolean } = {};

  //visited = 2
  //rampart = 1


  private newVisited: CostMatrix = new PathFinder.CostMatrix();

  private test() {

    var room = Game.rooms[this._roomName];
    if (room == undefined) throw Error("Cant get neighbors on a non-visible room...");

    const visited = new PathFinder.CostMatrix();
    const unchecked :any[] = [];

    room.find(FIND_EXIT).forEach(e => {
      unchecked.push(this.friendlyName(e));
      visited.set(e.x, e.y, 4);
    })

    //while (unchecked.length != 0) {
    //  const next = unchecked.pop();

    //  for (let x = next.x - 1; x <= next.x + 1; x++) {
    //    for (let y = next.y - 1; y <= next.y + 1; y++) {
    //      if (x < 0 || x > 49 || y < 0 || y > 49) continue;
    //      if (x === next.x && y === next.y) continue;
    //      if(visited.get(x,y))
    //    }
    //  }
    //}

  }


  private getNeighbors(source: RoomPosition, includeRamparts: boolean) : RoomPosition[] {
    var room = Game.rooms[source.roomName];
    if (room == undefined) throw Error("Cant get neighbors on a non-visible room...");

    var found: RoomPosition[] = [];

    var top = new RoomPosition(source.x, source.y - 1, source.roomName)
    var bottom = new RoomPosition(source.x, source.y + 1, source.roomName)
    var left = new RoomPosition(source.x - 1, source.y, source.roomName)
    var right = new RoomPosition(source.x + 1, source.y, source.roomName)
    var topLeft = new RoomPosition(source.x - 1, source.y - 1, source.roomName)
    var bottomLeft = new RoomPosition(source.x - 1, source.y + 1, source.roomName)
    var topRight = new RoomPosition(source.x + 1, source.y - 1, source.roomName)
    var bottomRight = new RoomPosition(source.x + 1, source.y + 1, source.roomName)

    if (this.walkable(top, includeRamparts)) found.push(top);
    if (this.walkable(bottom, includeRamparts)) found.push(bottom);
    if (this.walkable(left, includeRamparts)) found.push(left);
    if (this.walkable(right, includeRamparts)) found.push(right);
    if (this.walkable(topLeft, includeRamparts)) found.push(topLeft);
    if (this.walkable(bottomLeft, includeRamparts)) found.push(bottomLeft);
    if (this.walkable(bottomRight, includeRamparts)) found.push(bottomRight);
    if (this.walkable(topRight, includeRamparts)) found.push(topRight);

    return found;


  }

  private walkable(position: RoomPosition, includeRamparts: boolean): boolean {
    if (position.x < 0 || position.y < 0) return false;
    if (position.x > 49 || position.y > 49) return false;
    if (this.visited[this.friendlyName(position)]) return false;
    
    const lookItems = position.look();
    for (var i in lookItems) {
      var lookItem = lookItems[i];
      var walkStatus: BFSSearchType = "blocked";
      
      if (lookItem.type == LOOK_TERRAIN) {
        let terrain = lookItem[LOOK_TERRAIN];
        if (terrain == "plain" || terrain == "swamp") {
          walkStatus = "walkable";
        }
      }

      const structures = position.lookFor(LOOK_STRUCTURES);
      if (_.find(structures, s => s.structureType == STRUCTURE_RAMPART)) {
        walkStatus = "rampart";
      }
      else if (_.find(structures, s => s.structureType == STRUCTURE_ROAD)) {
        walkStatus = "walkable"
      }

      position.bfsType = walkStatus;
      return position.bfsType != "blocked";
    }
    throw Error("should never get here");
  }


  private friendlyName(roomPosition: RoomPosition) {
    return `${roomPosition.x}:${roomPosition.y}`;
  }


  public findBaseEntrancesBFS(roomName: string): RoomPosition[] {

    //constraining to 1 room for debugging
    if (roomName != "W4S43") return [];

    var room = Game.rooms[roomName];
    if (room == undefined) throw Error("Can't BFS a non-visible room...");

    //var entrances: { [friendlyName: string]: RoomPosition } = {};
    var entrances: RoomPosition[] = [];

    var queue = new Queue<RoomPosition>();

    var count: number = 0;
    var exits = room.find(FIND_EXIT);
    for (const i in exits) {
      const start = exits[i];
      this.visited[this.friendlyName(start)] = true
      count++;
      //room.visual.circle(start.x, start.y);
      queue.push(start);
    }

    while (queue.length() > 0) {
      const next = queue.pop();
      if (next == undefined) throw Error("queue.length > 0, next undefined");

      var neighbors = this.getNeighbors(next, true);
      for (var i in neighbors) {
        let neighbor = neighbors[i];
        if (this.visited[this.friendlyName(neighbor)]) continue;

        if (neighbor.bfsType == STRUCTURE_RAMPART) {
          if (!_.find(entrances, t => t.x == neighbor.x && t.y == neighbor.y)) {
            entrances.push(neighbor);
          }
        }
        else {
          this.visited[this.friendlyName(neighbor)] = true;
          count++;
          //room.visual.circle(neighbor.x, neighbor.y);
          queue.push(neighbor);
        }
      }
    }
    console.log("COUNT!!!!!!!!!! : " + count)
    return entrances;
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
    var mem = creep.memory as CreepMemory;
    if (getHomeRoom(creep.name) != homeRoomName) continue;
    if (!mem.idle) continue;
    if (mem.role != role && role !="ROLE_ALL") continue;
    idle.push(creep);
  }
  return idle;

  //return Game.rooms[homeRoomName].find(FIND_MY_CREEPS, {
  //  filter: (creep: Creep) => {
  //    let memory = (creep.memory as CreepMemory);
  //    return memory.idle && (memory.role == role || role =="ROLE_ALL");
  //  }
  //});
}
export function ildeCreepCount(roomName: string, role: CreepRole ="ROLE_ALL") {
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
    let container = roomContainers[id] as StructureContainer;
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
export function findAllContainers(roomName: string): Array<StructureContainer> {
  return Game.rooms[roomName].find(FIND_STRUCTURES).filter(i => {
    return i.structureType == STRUCTURE_CONTAINER;
  }) as StructureContainer[];

}
export function findIdleSmartStructures(roomName: string): Array<SmartStructure> {

  let roomMem = Game.rooms[roomName].memory as RoomMemory;
  let structs = roomMem.towers;
  //console.log("Tower memory count: " + Object.keys(structs).length);
  var t: SmartStructure[] = [];
  for (var s in structs) {
    var smart = structs[s] as SmartStructure;
    var mem = smart.memory as StructureMemory;
    t.push(smart);
  }
  //console.log("Smart Structure Count: " + t.length);
  return t;
  //return structs.filter(struc => {
  //  let mem = struc.memory as StructureMemory;
  //  return mem.idle;
  //})

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
//export function getRoleString(job: CreepRole): string {
//  switch (job) {
//    case"ROLE_MINER": return "ROLE_MINER";
//    case"ROLE_CARRIER": return "ROLE_CARRIER";
//    case"ROLE_UPGRADER": return "ROLE_UPGRADER";
//    case"ROLE_WORKER": return "ROLE_WORKER";
//    case"ROLE_SCOUT": return "ROLE_SCOUT";
//    case"ROLE_REMOTE_UPGRADER": return "ROLE_REMOTE_UPGRADER";
//    case"ROLE_UNASSIGNED": return "ROLE_UNASSIGNED";
//    case"ROLE_DEFENDER": return "ROLE_DEFENDER";
//    case"ROLE_ALL": return "ROLE_ALL";
//    default: {
//      console.log("unknown role: " + job)
//      return "unknown role";
//    }
//  }
//}
export enum CantBuildReasons {
  NotTheOwner = -1,
  NameAlreadyExists = -3,
  BuildingBusy = -4,
  NotEnoughEnergy = -6,
  InvalidArguments = -10,
  RCLNotHighEnough = -14

}
// export function hasEnergy(creepName: string) : boolean {
// 	let creep = Game.creeps[creepName];
// 	return creep.carry.energy > 0;
// }
// export function hasRoom(creepName: string) : boolean{
// 	let creep = Game.creeps[creepName];
// 	return creep.carry.energy < creep.carryCapacity;
// }
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



// export function sendCreepsHome(roomName: string, creeps: Creep[]): void
// {
// 	let spawn = findStructureSpawns(roomName)[0];

// 	console.log(`There are ${creeps.length} idle creeps.`)
// 	for (const creep of creeps)
// 	{
// 		let mem = creep.memory as CreepMemory;
// 		if (mem.idle) creep.moveTo(spawn);
// 	}
// }
