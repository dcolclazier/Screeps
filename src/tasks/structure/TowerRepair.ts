import { StructureTask } from "tasks/StructureTask";
import { StructureTaskRequest } from "tasks/StructureTaskRequest";
import { StructureTaskQueue } from "tasks/StructureTaskQueue";
import { CreepTaskQueue } from "../CreepTaskQueue";

export class TowerRepairRequest extends StructureTaskRequest {
  priority: number = 2;
  name: string = "TowerRepair";
  maxConcurrent: number = 3;
  static maxHitPoints: number = 1200000;
  constructor(roomName: string, siteID: string) {
    super(roomName, siteID)
  }

}
export class TowerRepair extends StructureTask {

  protected init(): void {
    super.init();
    this.request.status = "PREPARE";
  }
  protected prepare(): void {
    super.prepare();
    this.request.status = "IN_PROGRESS"
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == "FINISHED") return;
    //console.log("continue start: " + this.request.targetID)
    const site = Game.getObjectById(this.request.targetID) as AnyStructure;
    const tower = Game.getObjectById(this.request.assignedTo) as StructureTower;
    if (tower == null || site == null) {
      console.log("something went wrong")
    }
    if (tower.energy < tower.energyCapacity * .5) {
      this.request.status = "FINISHED";
      return;
    }
    
    var status = tower.repair(site);
    if (status == OK) {
      this.request.status = "FINISHED";
    }

    
  }
  
  constructor(taskInfo: StructureTaskRequest) {
    super(taskInfo);
  }
  static addTask(roomName: string) {
    const room = Game.rooms[roomName];
    const targets = room.find(FIND_STRUCTURES)
      .filter(structure => structure.hits < structure.hitsMax * .75 && structure.hits < TowerRepairRequest.maxHitPoints)

    const sorted = _.sortBy(targets, t => t.hits);
    var target = _.first(sorted);
    if (target != undefined) {
      if (CreepTaskQueue.active(roomName, "Dismantle", target.id).length == 0) {
        StructureTaskQueue.addPendingRequest(new TowerRepairRequest(roomName, target.id));
      }
      
    }

  }
}
