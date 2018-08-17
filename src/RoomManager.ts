

export class RoomManager {

  constructor() {
    console.log("Global reset!!")
  }
  //creeps: Array<Creep> = [];
  _defaultSpawn: string = "";
  //creepsTest: { [roomName: string]: CreepDictionary } = {};
  //creeps2: { [roomName: string]: Creep[] } = {}
  _sources2: { [roomName: string]: SourceMemory[] } = {}
  _links2: { [roomName: string]: LinkMemory[] } = {}
  _containers2: { [roomName: string]: ContainerMemory[] } = {}
  _towers2: { [roomName: string]: TowerMemory[] } = {}

  
  getSources2(roomName: string): SourceMemory[] {
    const room = Memory.rooms[roomName];
    if (room == undefined) {
      console.log("ERROR_getSources2 - undefined room in memory? how? " + roomName);
      return [];
    }
    if (this._sources2[roomName] == undefined) {
      
      this._sources2[roomName] = this.loadSources2(roomName);
      this.initializeSources(roomName)
    }
    return this._sources2[roomName];
  }
  getContainers2(roomName: string): ContainerMemory[] {
    const room = Memory.rooms[roomName];
    if (room == undefined) {
      console.log("ERROR_getContainers2 - undefined room in memory? how? " + roomName);
      return [];
    }
    if (this._containers2[roomName] == undefined) {
      this._containers2[roomName] = this.loadContainers2(roomName);
      this.initializeContainers(roomName);
      
    }
    
    return this._containers2[roomName];
  }
  getLinks2(roomName: string): LinkMemory[] {
    const room = Memory.rooms[roomName];
    if (room == undefined) {
      console.log("ERROR_getLinks2 - undefined room in memory? how?" + roomName);
      return [];
    }
    var links = this._links2[roomName];
    if (links == undefined) {
      links = this._links2[roomName] = this.loadLinks2(roomName);
    }
    return links;
  }
  getTowers2(roomName: string): TowerMemory[] {
    const room = Memory.rooms[roomName];
    if (room == undefined) {
      console.log("ERROR_getLinks2 - undefined room in memory? how?" + roomName);
      return [];
    }
    var towers = this._towers2[roomName];
    if (towers == undefined) {
      towers = this._towers2[roomName] = this.loadTowers2(roomName);
    }
    return towers;
  }

  public getEnergyLevel(roomName: string): number {

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

  public findClosestSource(roomName: string, targetPos: HasPos, energyAmount: number = 0) {
    var withEnergy2: Source[] = [];
    var sources = this.getSources2(roomName);
    _.forEach(sources, sourceMem => {
      var source = <Source>Game.getObjectById(sourceMem.id);
      if (source.energy > energyAmount) withEnergy2.push(source);
    })
    return _.min(withEnergy2, source => source.pos.getRangeTo(targetPos)).id;
  }

  public Run(roomName: string): void {
    this.loadResources(roomName);
    this.getTowers2(roomName);
    this.getContainers2(roomName);
    
  }

  /* Initialization methods - runs after loaded*/
  private initializeContainers(roomName: string) {

    //var test = this.getContainers2(roomName);
    _.forEach(this._containers2[roomName], c => {
      if (c.shouldRefill == undefined || c.allowedWithdrawRoles == undefined) {
        var rangeToSources = _.map(this.getSources2(roomName), s => c.pos.getRangeTo(s));
        var closestRange = _.min(rangeToSources, s => s);
        if (closestRange <= 2) {
          //miner depository
          c.allowedWithdrawRoles = ["ROLE_WORKER", "ROLE_CARRIER"];
        }
        else {
          //probably container withdraw point
          c.allowedWithdrawRoles = ["ROLE_UPGRADER"];
          c.shouldRefill = true;
        }
      }
    })
    //this._containers2[roomName] = test;

    //const sources = this.sources;

  }
  private initializeSources(roomName: string) {
    
    _.forEach(this._sources2[roomName], source => {
      if (source.linkID == "" && source.containerID == "") {
       
        if (source.linkID == "") {
          const closestLinks = _.filter(this.getLinks2(roomName), l => source.pos.getRangeTo(l) <= 2);
          if (closestLinks.length > 0) {
            source.linkID = closestLinks[0].id;
          }
        }
        if (source.containerID == "") {
          var test = this.getContainers2(roomName);
          const closestContainers = _.filter(test, c => source.pos.getRangeTo(c.pos) <= 2);
          if (closestContainers.length > 0) {
            source.containerID = closestContainers[0].id;
          }
        }
      }
    });
  }

  /* Loading methods - should refactor eventually...*/
  
  private loadContainers2(roomName: string): ContainerMemory[] {
    const roomMem = Memory.rooms[roomName];
    if (roomMem == undefined) {
      console.log("ERROR_loadSources2 - need to handle undefined room " + roomName);
      return [];
    }
    const room = Game.rooms[roomName];
    if (room == undefined) {
      console.log("WARNING_loadSources2 - don't have visibility to room " + roomName);
      return [];
    }
    const containers = room.find(FIND_STRUCTURES).filter(s => s.structureType == "container");
    const containerMems: ContainerMemory[] = [];
    _.forEach(containers, container => {
      const mem = <ContainerMemory>{
        type: container.structureType,
        roomName: roomName,
        currentTask: "",
        pos: container.pos,
        id: container.id,
        shouldRefill: false,
        allowedWithdrawRoles: undefined,
      };
      if (roomMem.structures[container.id] == undefined) roomMem.structures[container.id] = mem;
      containerMems.push(mem);
    });
    return containerMems;
  }

  //private loadCreepsTest(roomName: string): void {

  //  //const roomMem = Memory.rooms[roomName];
  //  ////const dictionary: CreepDictionary = {}; WONT WORK assigning will rewrite creeps in other rooms
  //  //if (roomMem == undefined) {
  //  //  console.log("ERROR_loadCreepsTest - need to handle undefined room " + roomName);
  //  //  return {};
  //  //}
  //  const room = Game.rooms[roomName];
  //  if (room == undefined) {
  //    console.log("WARNING_loadCreepsTest - don't have visibility to room " + roomName);
  //    return;
  //  }
  //  if (this.creepsTest[roomName] == undefined || this.creepsTest[roomName] == null) {
  //    console.log(`Initializing creep dictionary for ${roomName}`)
  //    this.creepsTest[roomName] = {};
  //  }
  //  const creeps = room.find(FIND_MY_CREEPS);
  //  for (var id in creeps) {
  //    const creep = creeps[id];
  //    if (this.creepsTest[creep.name] == undefined || this.creepsTest[creep.name] == null) {
  //      console.log(`Don't have cached memory for ${creep.name} - creating`);
  //      if (creep.memory == undefined) {
  //        console.log(`found a creep with no memory - would have reset it here... ${creep.name}`)
  //        //creep.memory = {
  //        //  idle: true,
  //        //  alive: true,
  //        //  role: getRole(creep.name),
  //        //  currentTask: "",
  //        //  homeRoom: room.name,
  //        //  _trav: 0,
  //        //  _travel: 0
  //        //};;
  //      }
  //      else {
  //        this.creepsTest[roomName][creep.id] = creep.memory;
  //      }

  //    }
  //  }


  //  //const towers = room.find(FIND_MY_STRUCTURES).filter(s => s.structureType == "tower");
  //  //const sourceMems: TowerMemory[] = [];
  //  //_.forEach(towers, tower => {
  //  //  const mem = <TowerMemory>{
  //  //    pos: tower.pos,
  //  //    towerMode: "IDLE",
  //  //    id: tower.id,
  //  //    currentTask: "",
  //  //    type: tower.structureType,
  //  //    roomName: tower.room.name,
  //  //  }
  //  //  if (roomMem.structures[tower.id] == undefined) roomMem.structures[tower.id] = mem;
  //  //  sourceMems.push(mem);
  //  //});
  //  //return sourceMems;
  //}
  private loadTowers2(roomName: string): TowerMemory[] {
    const roomMem = Memory.rooms[roomName];
    if (roomMem == undefined) {
      console.log("ERROR_loadSources2 - need to handle undefined room " + roomName);
      return [];
    }
    const room = Game.rooms[roomName];
    if (room == undefined) {
      console.log("WARNING_loadSources2 - don't have visibility to room " + roomName);
      return [];
    }

    const towers = room.find(FIND_MY_STRUCTURES).filter(s => s.structureType == "tower");
    const sourceMems: TowerMemory[] = [];
    _.forEach(towers, tower => {
      const mem = <TowerMemory>{
        pos: tower.pos,
        towerMode: "IDLE",
        id: tower.id,
        currentTask: "",
        type: tower.structureType,
        roomName: tower.room.name,
      }
      if (roomMem.structures[tower.id] == undefined) roomMem.structures[tower.id] = mem;
      sourceMems.push(mem);
    });
    return sourceMems;
  }
  private loadSources2(roomName: string): SourceMemory[] {
    const roomMem = Memory.rooms[roomName];
    if (roomMem == undefined) {
      console.log("ERROR_loadSources2 - need to handle undefined room " + roomName);
      return [];
    }
    const room = Game.rooms[roomName];
    if (room == undefined) {
      console.log("WARNING_loadSources2 - don't have visibility to room " + roomName);
      return [];
    }

    const sources = room.find(FIND_SOURCES);
    const sourceMems: SourceMemory[] = [];
    _.forEach(sources, source => {
      const mem = <SourceMemory>{
        id: source.id,
        pos: source.pos,
        linkID: "",
        currentTask: "",
        assignedTo: [],
        type: "source",
        roomName: source.room.name,
        containerID: "",
      }
      if (roomMem.structures[source.id] == undefined) roomMem.structures[source.id] = mem;
      sourceMems.push(mem);
    });
    return sourceMems;
  }
  private loadLinks2(roomName: string): LinkMemory[] {
    const roomMem = Memory.rooms[roomName];
    if (roomMem == undefined) {
      console.log("ERROR_loadLinks2 - need to handle undefined room " + roomName);
      return [];
    }
    const room = Game.rooms[roomName];
    if (room == undefined) {
      console.log("WARNING_loadLinks2 - don't have visibility to room " + roomName);
      return [];
    }

    const links = room.find(FIND_MY_STRUCTURES).filter(s => s.structureType == "link");
    //const sources = this.getSources2(roomName);
    const linkMems: LinkMemory[] = [];
    _.forEach(links, link => {
      let linkMode: LinkMode = "SEND";
      if (room.storage != undefined) {
        var rangeToStorage = room.storage.pos.getRangeTo(link);
        if (rangeToStorage == 1) linkMode = "MASTER_RECEIVE"
      }
      else if (room.controller != undefined) {
        var rangeToController = room.controller.pos.getRangeTo(link);
        if (rangeToController <= 2) linkMode = "SEND";
      }
      else {
        //linkMode = "SLAVE_RECEIVE";
      }

      const mem = <LinkMemory>{
        pos: link.pos,
        linkMode: linkMode,
        id: link.id,
        currentTask: "",
        type: link.structureType,
        roomName: link.room.name,
      }
      if (roomMem.structures[link.id] == undefined) roomMem.structures[link.id] = mem;
      linkMems.push(mem);
    });
    return linkMems;
  }
  private loadResources(roomName: string): void {
    const room = Game.rooms[roomName];
    const roomMem = room.memory as RoomMemory
    const resources = room.find(FIND_DROPPED_RESOURCES) as Resource[];
    const sorted = _.sortBy(resources, r => r.amount);
    roomMem.activeResourcePileIDs = sorted.map(u => u.id);

  }
  /* End Loading methods*/
  
//export function findIdleCreeps(homeRoomName: string, role: CreepRole = "ROLE_ALL"): Creep[] {

//  var creeps = Game.creeps;
//  var idle: Creep[] = []
//  for (var i in creeps) {
//    var creep = creeps[i] as Creep;
//    if (creep.memory.homeRoom != homeRoomName) continue;
//    if (!creep.memory.idle) continue;
//    if (creep.memory.role != role && role != "ROLE_ALL") continue;
//    idle.push(creep);
//  }
//  return idle;

//}
//export function findIdleStructures(roomName: string, type?: StructureConstant | undefined): string[] {

//  const room = Game.rooms[roomName];
//  if (room == undefined) return [];
//  var test = _.filter(room.memory.structures, s => s.currentTask == "" && (type == undefined || s.type == type));
//  return _.map(test, s => s.id);
//}
//export function idleCreepCount(roomName: string, role: CreepRole = "ROLE_ALL") {
//  return findIdleCreeps(roomName, role).length;
//}
//export function findClosestContainer(roomName: string, targetID: string, fullOK: boolean, emptyOK: boolean): StructureContainer | undefined {
//  let target = Game.getObjectById(targetID);
//  if (target == null) {
//    //console.log("container target was null.")
//    return;
//  }
//  let roomContainers = findAllContainers(roomName)
//    .sort((a, b) => a.pos.getRangeTo(target as any) - b.pos.getRangeTo(target as any));

//  for (const id in roomContainers) {
//    let container = <StructureContainer>Game.getObjectById(id);
//    if (container == null) continue;
//    if (!fullOK && container.store.energy == container.storeCapacity) continue; //has room
//    if (!emptyOK && container.store.energy == 0) continue; //can't be empty
//    return container;
//  }
//  return undefined;
//}
//export function creepIDsByRole(roomName: string, role: CreepRole): string[] {
//  let room = Game.rooms[roomName];
//  let creeps = room.find(FIND_MY_CREEPS) as Creep[];
//  let found: string[] = [];
//  for (const key in creeps) {
//    if (creeps.hasOwnProperty(key)) {
//      const creep = creeps[key];
//      const mem = creep.memory as CreepMemory;
//      if (mem.role == role || role == undefined) found.push(creep.id);
//    }
//  }
//  return found;
//}
//export function creepNamesByRole(roomName: string, role: CreepRole): string[] {
//  let room = Game.rooms[roomName];
//  let creeps = room.find(FIND_MY_CREEPS) as Creep[];
//  let found: string[] = [];
//  for (const key in creeps) {
//    if (creeps.hasOwnProperty(key)) {
//      const creep = creeps[key];
//      const mem = creep.memory as CreepMemory;
//      if (mem.role == role || role == undefined) found.push(creep.name);
//    }
//  }
//  return found;
//}
//export function creepCount(roomName: string, role: CreepRole | undefined): number {
//  let room = Game.rooms[roomName];
//  if (room == undefined) return 0;
//  let creeps = room.find(FIND_MY_CREEPS) as Creep[];
//  if (role == undefined) return creeps.length;
//  else {
//    return creepIDsByRole(roomName, role).length
//  }
//}
//export function creepCountAllRooms(role: CreepRole): number {
//  var count = 0;
//  let rooms = Game.rooms;
//  for (var id in rooms) {
//    var room = rooms[id];
//    let creeps = room.find(FIND_MY_CREEPS) as Creep[];
//    count += creepIDsByRole(room.name, role).length;
//  }
//  return count;
//}
//export function roomSources(roomName: string): Source[] {
//  return Game.rooms[roomName].find(FIND_SOURCES) as Source[];
//}
//export function sourceCount(roomName: string) {
//  return roomSources(roomName).length;
//}
//export function findAllContainers(roomName: string): ContainerMemory[] {

//  return roomManager.getContainers2(roomName);
//  //return Game.rooms[roomName].find(FIND_STRUCTURES).filter(i => {
//  //  return i.structureType == STRUCTURE_CONTAINER;
//  //}) as StructureContainer[];

//}
//export function findClosestContainerID(roomName: string, creepRole: CreepRole, energyAmount: number, targetID: string): string | undefined {

//  var containerIDs = findContainers(roomName, creepRole, energyAmount, targetID);
//  if (containerIDs.length == 0) return undefined;
//  else return containerIDs[0];

//}
//export function getRoomEnergyLevel(roomName: string): number {

//  //var roomCreeps = _.filter(Game.creeps, c => c.memory.homeRoom = roomName)
//  var room = Game.rooms[roomName];
//  var creeps = room.find(FIND_MY_CREEPS);

//  if (creeps.length < 3 && room.energyAvailable < 800) return 1;

//  let cap = room.energyCapacityAvailable;

//  if (cap < 550) return 1;
//  else if (cap <= 950) return 2;
//  else if (cap <= 1500) return 3;
//  else if (cap <= 3500) return 4;
//  else return 5;
//}
//export function findClosestSourceID(roomName: string, targetPos: RoomPosition, energyAmount: number = 0): string | undefined {

//  var sources = roomManager.getSources2(roomName);
//  var withEnergy2: Source[] = [];

//  _.forEach(sources, sourceMem => {
//    var source = <Source>Game.getObjectById(sourceMem.id);
//    if (source.energy > energyAmount) withEnergy2.push(source);
//  })
//  return _.min(withEnergy2, source => targetPos.getRangeTo(source)).id
//}
//export function getRoomType(roomName: string): RoomType {
//  if (Memory.rooms[roomName] != undefined) return Memory.rooms[roomName].roomType;

//  const room = Game.rooms[roomName];
//  if (room == undefined) return "UNKNOWN";

//  if (room.controller != undefined) {
//    if (room.controller.my) {
//      if (room.find(FIND_SOURCES).length > 0) return "OWNED";
//      else return "REMOTE_HARVEST"; //todo - handle expansion case
//    }
//    else return "HOSTILE"; //todo - add in friendly folks
//  }
//  else {
//    if (room.find(FIND_HOSTILE_SPAWNS).length > 0) return "SOURCE_KEEPER";
//    else return "EMPTY"
//  }

//  //todo - refactor this?
//}
//export function findContainers(roomName: string, creepRole: CreepRole, energyAmount: number, sortByRangeToID: string = ""): string[] {


//  var room = Game.rooms[roomName];
//  if (room == undefined) return [];
//  var containers = findAllContainers(roomName);

//  var filtered = _.filter(containers, c =>
//    _.includes(<CreepRole[]>c.allowedWithdrawRoles, creepRole)
//    && (<StructureContainer>Game.getObjectById(c.id)).store.energy > energyAmount);

//  if (sortByRangeToID != "") {
//    var rangeToTarget = <RangeTarget>Game.getObjectById(sortByRangeToID);
//    if (rangeToTarget == undefined) throw new Error("findContainers:rangeToTarget cannot be undefined");

//    var sorted = _.sortBy(filtered, c => c.pos.getRangeTo(rangeToTarget))
//    return _.map(sorted, s => s.id);
//  }
//  else return _.map(filtered, f => f.id);

//}

}


export const roomManager = new RoomManager();
const CACHE_TIMEOUT = 50;
const SHORT_CACHE_TIMEOUT = 10;
//export class $ { // $ = cash = cache... get it? :D
//  static structures<T extends Structure>(saver: { ref: string }, key: string, callback: () => T[],
//    timeout = CACHE_TIMEOUT): T[] {
//    let cacheKey = saver.ref + ':' + key;
//    if (!_cache.structures[cacheKey] || Game.time > _cache.expiration[cacheKey]) {
//      // Recache if new entry or entry is expired
//      _cache.structures[cacheKey] = callback();
//      _cache.expiration[cacheKey] = getCacheExpiration(timeout, Math.ceil(timeout / 10));
//    } else {
//      // Refresh structure list by ID if not already done on current tick
//      if (_cache.accessed[cacheKey] < Game.time) {
//        _cache.structures[cacheKey] = _.compact(_.map(_cache.structures[cacheKey],
//          s => Game.getObjectById(s.id))) as Structure[];
//        _cache.accessed[cacheKey] = Game.time;
//      }
//    }
//    return _cache.structures[cacheKey] as T[];
//  }

//  static number(saver: { ref: string }, key: string, callback: () => number, timeout = SHORT_CACHE_TIMEOUT): number {
//    let cacheKey = saver.ref + ':' + key;
//    if (_cache.numbers[cacheKey] == undefined || Game.time > _cache.expiration[cacheKey]) {
//      // Recache if new entry or entry is expired
//      _cache.numbers[cacheKey] = callback();
//      _cache.expiration[cacheKey] = getCacheExpiration(timeout, Math.ceil(timeout / 10));
//    }
//    return _cache.numbers[cacheKey];
//  }

//  static list<T>(saver: { ref: string }, key: string, callback: () => T[], timeout = CACHE_TIMEOUT): T[] {
//    let cacheKey = saver.ref + ':' + key;
//    if (_cache.lists[cacheKey] == undefined || Game.time > _cache.expiration[cacheKey]) {
//      // Recache if new entry or entry is expired
//      _cache.lists[cacheKey] = callback();
//      _cache.expiration[cacheKey] = getCacheExpiration(timeout, Math.ceil(timeout / 10));
//    }
//    return _cache.lists[cacheKey];
//  }

//  static costMatrix(roomName: string, key: string, callback: () => CostMatrix,
//    timeout = SHORT_CACHE_TIMEOUT): CostMatrix {
//    let cacheKey = roomName + ':' + key;
//    if (_cache.costMatrices[cacheKey] == undefined || Game.time > _cache.expiration[cacheKey]) {
//      // Recache if new entry or entry is expired
//      _cache.costMatrices[cacheKey] = callback();
//      _cache.expiration[cacheKey] = getCacheExpiration(timeout, Math.ceil(timeout / 10));
//    }
//    return _cache.costMatrices[cacheKey];
//  }

//  static costMatrixRecall(roomName: string, key: string): CostMatrix | undefined {
//    let cacheKey = roomName + ':' + key;
//    return _cache.costMatrices[cacheKey];
//  }

//  static set<T extends HasRef, K extends keyof T>(thing: T, key: K,
//    callback: () => (T[K] & (undefined | HasID | HasID[])),
//    timeout = CACHE_TIMEOUT) {
//    let cacheKey = thing.ref + '$' + key;
//    if (!_cache.things[cacheKey] || Game.time > _cache.expiration[cacheKey]) {
//      // Recache if new entry or entry is expired
//      _cache.things[cacheKey] = callback();
//      _cache.expiration[cacheKey] = getCacheExpiration(timeout, Math.ceil(timeout / 10));
//    } else {
//      // Refresh structure list by ID if not already done on current tick
//      if (_cache.accessed[cacheKey] < Game.time) {
//        if (_.isArray(_cache.things[cacheKey])) {
//          _cache.things[cacheKey] = _.compact(_.map(_cache.things[cacheKey] as HasID[],
//            s => Game.getObjectById(s.id))) as HasID[];
//        } else {
//          _cache.things[cacheKey] = Game.getObjectById((<HasID>_cache.things[cacheKey]).id) as HasID;
//        }
//        _cache.accessed[cacheKey] = Game.time;
//      }
//    }
//    thing[key] = _cache.things[cacheKey] as T[K] & (undefined | HasID | HasID[]);
//  }

//}
