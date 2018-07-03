import { RoomMemory, CreepMemory, StructureMemory, SmartStructure, SmartSource, SmartContainer } from "utils/memory";
import { CreepManager } from "CreepFactory";
import * as utils from "utils/utils";
import { TaskManager } from "taskManager";
import { CreepRole } from "utils/utils";

export let creeps: Creep[];
export let creepCount: number = 0;

export class RoomManager {
  loadResources(roomName: string): void {
    const room = Game.rooms[roomName];
    const roomMem = room.memory as RoomMemory
    const resources = room.find(FIND_DROPPED_RESOURCES) as Resource[];
    //console.log(JSON.stringify(resources))
    const sorted = _.sortBy(resources, r => r.amount);
    roomMem.activeResourcePileIDs = sorted.map(u => u.id);

  }
  creeps: Array<Creep> = [];
  creepCount: number = 0;


  public Run(roomName: string): void {

    //this.test(roomName);
    this.loadCreeps(roomName);
    var energyLevel = this.getRoomEnergyLevel(roomName);
    this.loadResources(roomName);
    this.loadHarvestingSpots(roomName);
    this.loadSmartContainers(roomName);
    this.loadSmartStructures(roomName);
    CreepManager.spawnMissingCreeps(roomName, energyLevel);

    TaskManager.Run(roomName, energyLevel);
  }
  _defaultSpawn: string = "";
  private loadCreeps(roomName: string) {
    let room = Game.rooms[roomName];
    creeps = room.find(FIND_MY_CREEPS);
    let spawn = room.find(FIND_MY_SPAWNS)[0];
    if (spawn != undefined) this._defaultSpawn = spawn.id;
    creepCount = creeps.length;
    for (let id in creeps) {
      let creep = creeps[id];
      let mem = creep.memory as CreepMemory;
      if (mem.alive === undefined || mem.alive == false) {
        const memory: CreepMemory =
        {
          spawnID: (spawn != undefined ? spawn.id : this._defaultSpawn),
          idle: true,
          alive: true,
          role: utils.getRole(creep.name),
          currentTask: "",
        };
        creep.memory = memory;
      }
    }
    //console.log("creeps loaded: " + creeps.length)
  }
  private loadSmartStructures(roomName: string) {

    let room = Game.rooms[roomName]
    let memory = room.memory as RoomMemory;
    if (memory.smartStructures.length == 0) {
      memory.smartStructures = [];
      let structures = room.find(FIND_STRUCTURES);
      let smartStructures = _.filter(structures, function (structure) {
        return (
          structure.structureType == "tower"
        );
      });
      for (let id in smartStructures) {
        let structure = smartStructures[id];
        const newStructureMemory: StructureMemory =
        {
          idle: true,
          alive: true,
          currentTask: ""
        }
        const smartStructure: SmartStructure =
        {
          id: structure.id,
          memory: newStructureMemory
        }

        memory.smartStructures.push(smartStructure);
      }
    }

    
  }
  //private test(roomName: string) {

  //  var flags = Game.flags;
  //  for (var id in flags) {
  //    var flag = flags[id];
  //    if (flag.color == COLOR_WHITE && flag.secondaryColor == COLOR_WHITE) {
  //      var room = flag.room as Room;
  //      if (room != undefined) {
  //        console.log("found a future room flag! " + room.name);
  //        var scoutCount = utils.creepCountAllRooms(CreepRole.ROLE_SCOUT);
  //        if (scoutCount > 0) return;
          
  //        CreepManager.trySpawnCreep(_.first(utils.findSpawns(roomName)) as StructureSpawn, CreepRole.ROLE_SCOUT, this.getRoomEnergyLevel(roomName));
  //      }
  //    }
  //  }
  //}

  private getRoomEnergyLevel(roomID: string): number {
    let room = Game.rooms[roomID];
    if (creeps.length < 3 && room.energyAvailable < 800) return 1;

    let cap = room.energyCapacityAvailable;

    if (cap < 550) return 1;
    else if (cap <= 950) return 2;
    else return 3;
  }
  private loadSmartContainers(roomName: string) {
    let room = Game.rooms[roomName];
    let roomMemory = room.memory as RoomMemory;

    //if (Object.keys(roomMemory.harvestLocations).length > 0) return;
    //console.log("loading smart containers")
    let sources = room.find(FIND_SOURCES);
    let controller = _.first(room.find(FIND_STRUCTURES).filter(s => s.structureType == "controller"));
    let containers = room.find(FIND_STRUCTURES).filter(s => s.structureType == "container");

    _.each(containers, c => {
      var rangeToSources = sources.map(s => s.pos.getRangeTo(c));
      
      var sorted = _.sortBy(rangeToSources, s => s);
      if (_.first(sorted) == 1) {
        //miner depository
        let smart = new SmartContainer(roomName, c.id, false, [CreepRole.ROLE_WORKER, CreepRole.ROLE_CARRIER])
        roomMemory.containers[c.id] = smart;
      }
      else {
        //probably container withdraw point
        let smart = new SmartContainer(roomName, c.id, true, [CreepRole.ROLE_UPGRADER])
        roomMemory.containers[c.id] = smart;
      }
        
    })

  }
  private loadHarvestingSpots(roomName: string) {
    let room = Game.rooms[roomName];
    let roomMemory = room.memory as RoomMemory;

    if (Object.keys(roomMemory.harvestLocations).length > 0) return;
    //console.log("loading harvesting spots")
    let sources = room.find(FIND_SOURCES);


    let spots: { [index: string]: SmartSource } = { };

    for (const sourceID in sources) {
      let source = sources[sourceID];
      const spot: SmartSource = {
        sourceID: source.id,
        roomName: roomName,
        assignedTo: [],
      }
      spots[source.id] = spot;
      //spots.push(spot);
      roomMemory.harvestLocations = spots;
    }
    // 	let sourcePosition = source.pos as RoomPosition;
    // 	let right = room.getPositionAt(sourcePosition.x + 1, sourcePosition.y);
    // 	if (right != null) possibles.push(new HarvestSpot(source.id, right));

    // 	let left = room.getPositionAt(sourcePosition.x - 1, sourcePosition.y)
    // 	if (left != null) possibles.push(new HarvestSpot(source.id, left));

    // 	let top = room.getPositionAt(sourcePosition.x, sourcePosition.y - 1)
    // 	if (top != null) possibles.push(new HarvestSpot(source.id, top));

    // 	let bot = room.getPositionAt(sourcePosition.x, sourcePosition.y + 1)
    // 	if (bot != null) possibles.push(new HarvestSpot(source.id, bot));

    // 	let tr = room.getPositionAt(sourcePosition.x + 1, sourcePosition.y - 1)
    // 	if (tr != null) possibles.push(new HarvestSpot(source.id, tr));

    // 	let tl = room.getPositionAt(sourcePosition.x - 1, sourcePosition.y - 1)
    // 	if (tl != null) possibles.push(new HarvestSpot(source.id, tl));

    // 	let br = room.getPositionAt(sourcePosition.x + 1, sourcePosition.y + 1)
    // 	if (br != null) possibles.push(new HarvestSpot(source.id, br));

    // 	let bl = room.getPositionAt(sourcePosition.x - 1, sourcePosition.y + 1)
    // 	if (bl != null) possibles.push(new HarvestSpot(source.id, bl));

    // }
    // for (const id in possibles)
    // {
    // 	let possible = possibles[id];
    // 	if (possible.pos !== null)
    // 	{
    // 		const found: string = possible.pos.lookFor(LOOK_TERRAIN) as any;
    // 		if (found != "wall")
    // 		{
    // 			spots.push(possible);
    // 		}
    // 	}
    // }


  }

  

}



