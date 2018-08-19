import { Traveler } from "Traveler";

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

