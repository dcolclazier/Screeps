import { CreepTaskRequest } from "../CreepTaskRequest";
import { CreepTask } from "../CreepTask";
import * as utils from "utils/utils";
import { CreepTaskQueue } from "../CreepTaskQueue";
import { Task } from "../Task";

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
    var minerCount = global.creepManager.creepCount(targetRoomName, "ROLE_MINER");
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
    const sources = global.roomManager.sources(this.request.targetRoomName);
    const source = <SourceMemory>_.find(sources, s => s.id == this.request.targetID);
    const source2 = <SourceMemory>Game.rooms[this.request.targetRoomName].memory.structures[this.request.targetID];
    source.assignedTo.push(this.creep.name);
    source2.assignedTo.push(this.creep.name);
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
    if (global.roomManager.getEnergyLevel(roomName) < 3) {
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
    _.forEach(global.roomManager.sources(roomName), source => {
      //console.log(JSON.stringify(source))
      //console.log(`AssignedTo: ${source.assignedTo.length}, minersPer: ${minersPerSource}`);
      
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
    const sources = global.roomManager.sources(this.request.targetRoomName);
    const source = _.find(sources, s => s.id == this.request.targetID);
    if (source == undefined) {
      console.log("ERROR:Mine::deliver -> source was undefined...")
      return;
    }
    //const source = <SourceMemory>room.memory.structures[this.request.targetID];
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
    else if (source.containerID != "") {
      const containers = global.roomManager.containers(this.request.targetRoomName);
      const container = _.find(containers, c => c.id == source.containerID);
      if (container == undefined) {
        console.log("ERROR:Mine::deliver -> container was undefined...")
        return;
      }
      const c = <StructureContainer>Game.getObjectById(container.id);
      var result = this.creep.transfer(c, RESOURCE_ENERGY)
      if (result == ERR_NOT_IN_RANGE) {
        this.creep.travelTo(container);
      }
      else if (result == ERR_FULL) {
        this.creep.drop(RESOURCE_ENERGY)
      }
    }
    else {
      this.creep.drop(RESOURCE_ENERGY);
    }
    


  }

}

