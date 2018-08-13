import { CreepTaskRequest } from "../CreepTaskRequest";
import { CreepTask } from "../CreepTask";
import * as utils from "utils/utils";
import { CreepTaskQueue } from "../CreepTaskQueue";
import { Task } from "../Task";
import { roomManager } from "RoomManager";

export class MineRequest extends CreepTaskRequest {
  priority: number = 1;
  validRoles: CreepRole[] = ["ROLE_MINER"]
  name: string = "Mine";
  maxConcurrent: number;
  //source: SmartSource;
  constructor(originatingRoomName: string, targetRoomName: string, sourceID: string) {
    super(originatingRoomName, targetRoomName, sourceID, `💲`);

    //console.log("source id in mine req ctor: " + sourceID)
    const source = Game.getObjectById(sourceID);
    //const source = roomMem.sources[sourceID] as SmartSource;
    //this.source = _.find(roomMem.harvestLocations, h => h.sourceID == sourceID) as SmartSource;
    if (source == undefined) console.log("You cant init a mine request with an undefined source.")

    //console.log("after finding source: " + this.source.sourceID)
    var minerCount = utils.creepCount(targetRoomName, "ROLE_MINER");
    this.maxConcurrent = minerCount;
    //console.log("max concurrent: " + this.maxConcurrent)
  }
}

export class Mine extends CreepTask {
  static taskName: string = "Dismantle";
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }
  protected init(): void {
    super.init();

    //const source = Game.getObjectById(this.request.targetID) as Source;
    

    this.request.status = "PREPARE";

  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status != "PREPARE") return;
    if (this.creep.room.name != this.request.targetRoomName) return;

    const source = <SourceMemory>Game.rooms[this.request.targetRoomName].memory.structures[this.request.targetID];
    source.assignedTo.push(this.request.assignedToID);
    console.log("mine init assigned to " + source.assignedTo)

    this.request.status = "IN_PROGRESS";
  }
  protected work(): void {
    super.work();
    if (this.request.status != "IN_PROGRESS") return;

    if (this.creep.carryCapacity == 0) {
      this.harvest();
    }
    else {
      if (this.creep.carry.energy >= this.creep.carryCapacity - 10) this.deliver();
      else this.harvest();
    }
    //else(this.creep.drop(RESOURCE_ENERGY))

  }
  protected finish(): void {
    super.finish();
  }

  static addRequests(roomName: string): void {
    const room = Game.rooms[roomName];
    
    //const unassigned = _.filter(mem.harvestLocations, h => h.assignedTo === null) as SmartSource[];
    if (room == undefined) return;
    //if (unassigned.length === 0) return;
    var minersPerSource = 1;
    if (utils.getRoomEnergyLevel(roomName) < 3) {
      minersPerSource = 2;
    }
    //var sources = room.find(FIND_SOURCES) as Source[];

    var originatingRoomName = "";
    var targetRoomName = "";
    if (room.controller == undefined || !room.controller.my) {
      originatingRoomName = utils.closestOwnedRoom(room.name);
    }
    else {
      originatingRoomName = roomName;
    }
    targetRoomName = roomName;
    const sources = roomManager.getSources2(roomName);
    //const sources = utils.findStructures<SourceMemory>(roomName, "source");
    _.forEach(sources, source => {

      //console.log("sourceid: " + smartSource.sourceID)
      if (source.assignedTo.length != minersPerSource) {
        var needed = minersPerSource - source.assignedTo.length;
        //console.log("Needed: " + needed);
        for (var i = 0; i < needed; i++) {

          var request = new MineRequest(originatingRoomName, targetRoomName, source.id);
          var totalCurrent = CreepTaskQueue.count(request.targetRoomName, request.name);
          //console.log("total current:" + totalCurrent)
          if (totalCurrent < request.maxConcurrent) {
            //console.log("about to add source for this id: " + smartSource.sourceID)
            CreepTaskQueue.addPendingRequest(request);
          }
        }
      };
      
    })

    //for (const id in sources) {

    //  const source = room.memory.sources[id]
    //  //const source = sources[id] as Source;
    //  if (source.assignedTo == undefined) {
    //    source.assignedTo = [];
    //  }
    //  //console.log("sourceid: " + smartSource.sourceID)
    //  if (source.assignedTo.length == minersPerSource) continue;
    //  var needed = minersPerSource - source.assignedTo.length;
    //  //console.log("Needed: " + needed);
    //  for (var i = 0; i < needed; i++) {

    //    var request = new MineRequest(originatingRoomName, targetRoomName, source.id);
    //    var totalCurrent = CreepTaskQueue.count(request.targetRoomName, request.name);
    //    //console.log("total current:" + totalCurrent)
    //    if (totalCurrent < request.maxConcurrent) {
    //      //console.log("about to add source for this id: " + smartSource.sourceID)
    //      CreepTaskQueue.addPendingRequest(request);
    //    }
    //  }
      
    //}
  }

  private harvest() {
    const source = Game.getObjectById(this.request.targetID) as Source
    //creep.say("moving")
    if (this.creep.harvest(source) == ERR_NOT_IN_RANGE) {
      
      this.creep.travelTo(source);
    }

  }
  private deliver() {

    const room = Game.rooms[this.request.targetRoomName];
    //const source = Game.getObjectById(this.request.targetID) as Source;

    const source = <SourceMemory>room.memory.structures[this.request.targetID];
    //var smartSource = roomMemory.sources[this.request.targetID];
    //if (room.name == "W5S43") {
    //  console.log("smartsource id:" + smartSource.linkID)
    //}
    if (source.linkID != "") {
      var link = Game.getObjectById(source.linkID) as StructureLink;
      if (this.creep.transfer(link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        this.creep.travelTo(link);
      }

    }
    else {
      const container = utils.findClosestContainer(this.request.targetRoomName, this.creep.id, true, true) as StructureContainer;
      if (container == undefined || container.store.energy == container.storeCapacity
        || !this.creep.pos.inRangeTo(container.pos, 3)) {
        this.creep.drop(RESOURCE_ENERGY);
        return;
      }
      if (this.creep.transfer(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        this.creep.travelTo(container);
      }

    }


  }

}

