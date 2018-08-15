import { CreepTask } from "tasks/CreepTask";
import * as utils from "utils/utils"
import { CreepTaskQueue } from "../CreepTaskQueue";
import { CreepTaskRequest } from "../CreepTaskRequest";
import { roomManager } from "RoomManager";

export class FillTowerRequest extends CreepTaskRequest {
  static RefillThreshold: number = .75
  priority: number = 1
  validRoles: CreepRole[] = ["ROLE_CARRIER"];
  name = "FillTower";
  maxConcurrent = 1;
  constructor(roomName: string, towerID: string) {
    super(roomName, roomName, towerID, `⚗`)
    //super(roomName, `⚗`, towerID);
  }
}

export class FillTower extends CreepTask {
  static taskName: string = "FillTower";
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }
  protected init(): void {
    super.init();
   

    this.request.status = "PREPARE";
  }
  protected prepare(): void {
    super.prepare();
    if (this.request.status == "FINISHED") return;

    var room = Game.rooms[this.request.originatingRoomName];
    var roomMem = room.memory as RoomMemory;
    if (this.creep.carry.energy == 0) {

      if (this.collectFromMasterLink(room.name)) return;
      else if (this.collectFromStorage(room.name)) return;
      else if (this.collectFromContainer(room.name)) return;
      else if (this.collectFromTombstone(room.name)) return;
      else if (this.collectFromDroppedEnergy(room.name)) return;
      //this.collectFromSource(room.name);

    }
    else this.request.status = "IN_PROGRESS";
  }
  protected work(): void {
    super.work();
    if (this.request.status == "FINISHED") return;
    const tower = Game.getObjectById(this.request.targetID) as StructureTower;
    if (tower.energy == tower.energyCapacity) {
      this.request.status = "FINISHED";
      return;
    }
    if (this.creep.carry.energy == 0) {
      this.request.status = "PREPARE";
      return;

    }
    let result = this.creep.transfer(tower, RESOURCE_ENERGY)
    if (result == ERR_NOT_IN_RANGE) {
      this.creep.moveTo(tower, { visualizePathStyle: { stroke: '#ffffff' } });
    }
    else if (result == OK) {
      this.request.status = "FINISHED";
    }
  }
  static addRequests(roomName: string): void {
    let room = Game.rooms[roomName];
    const towers = room.find(FIND_MY_STRUCTURES)
      .filter(t => t.structureType == "tower"
        && t.energy < t.energyCapacity * FillTowerRequest.RefillThreshold) as StructureTower[];

    let sorted = towers.sort((a, b) => a.energy - b.energy);
    //console.log("sorted" + sorted.map(s => s.energy))

    for (const id in sorted) {
      let tower = sorted[id] as StructureTower;
      let request = new FillTowerRequest(roomName, tower.id);
      //if (CreepTaskQueue2.totalCount(roomName, request.name) < request.maxConcurrent) {
      if (CreepTaskQueue.count(roomName, request.name) < request.maxConcurrent) {
        CreepTaskQueue.addPendingRequest(request);
      }
    }
  }

}
