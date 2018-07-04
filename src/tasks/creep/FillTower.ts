import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "../CreepTaskQueue";
import { CreepRole } from "utils/utils";
import { CreepMemory } from "utils/memory";
import * as utils from "utils/utils"
import { TaskStatus } from "tasks/Task";

export class FillTowerRequest extends CreepTaskRequest {
  static RefillThreshold: number = .75
  priority: number = 2
  requiredRole: CreepRole[] = [CreepRole.ROLE_CARRIER];
  name = "FillTower";
  maxConcurrent = 1;
  constructor(roomName: string, towerID: string) {
    super(roomName, `⚗`, towerID);
  }
}

export class FillTower extends CreepTask {
  protected init(): void {
    super.init();
    this.request.status = TaskStatus.PREPARE;
  }
  protected prepare(): void {
    super.prepare();
    if (this.request.status == TaskStatus.FINISHED) return;

    var room = Game.rooms[this.request.roomName];
    var roomMem = room.memory as RoomMemory;
    if (this.creep.carry.energy == 0) {

      
      if(this.collectFromTombstone(room.name)) return;
      if (this.collectFromDroppedEnergy(room.name)) return;
      if (this.collectFromStorage(room.name)) return;
      //this.collectFromSource(room.name);

    }
    else this.request.status = TaskStatus.IN_PROGRESS;
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == TaskStatus.FINISHED) return;
    const tower = Game.getObjectById(this.request.targetID) as StructureTower;
    if (tower.energy == tower.energyCapacity) {
      this.request.status = TaskStatus.FINISHED;
      return;
    }
    let result = this.creep.transfer(tower, RESOURCE_ENERGY)
    if (result == ERR_NOT_IN_RANGE) {
      this.creep.moveTo(tower, { visualizePathStyle: { stroke: '#ffffff' } });
    }
    else if (result == OK) {
      this.request.status = TaskStatus.FINISHED;
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
      if (CreepTaskQueue.totalCount(roomName, request.name) < request.maxConcurrent) {
        CreepTaskQueue.addPendingRequest(request);
      }
    }
  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

    // doWork(): void
  // {
  // 	let info = this.request as FillTowerRequest;
  // 	let tower = Game.getObjectById(info.targetID) as StructureTower;
  // 	let creep = Game.creeps[this.request.assignedTo] as Creep;
  // 	let creepMemory = creep.memory as CreepMemory;

  // 	if (tower.energy == tower.energyCapacity)
  // 	{
  // 		this.finish();
  // 		return;
  // 	}
  // 	if (creepMemory.preppingForTask) this.collectFromContainer(this.request.roomName, creep.id);
  // 	else
  // 	{
  // 		let result = creep.transfer(tower, RESOURCE_ENERGY)
  // 		if (result == ERR_NOT_IN_RANGE)
  // 		{
  // 			creep.moveTo(tower, { visualizePathStyle: { stroke: '#ffffff' } });
  // 		}
  // 		else if(result == OK){
  // 			this.finish();
  // 		}
  // 	}

  // }
}
