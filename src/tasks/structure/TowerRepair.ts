import { StructureTask } from "tasks/StructureTask";
import { StructureTaskRequest } from "tasks/StructureTaskRequest";
import { StructureTaskQueue } from "tasks/StructureTaskQueue";
import { TaskStatus } from "tasks/Task";


export class TowerRepairRequest extends StructureTaskRequest {
  priority: number = 2;
  name: string = "TowerRepair";
  maxConcurrent: number = 3;
  static maxHitPoints: number = 1300000;
  constructor(roomName: string, siteID: string) {
    super(roomName, siteID)
  }

}
export class TowerRepair extends StructureTask {

  protected init(): void {
    super.init();
    this.request.status = TaskStatus.PREPARE;
  }
  protected prepare(): void {
    super.prepare();
    this.request.status = TaskStatus.IN_PROGRESS
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == TaskStatus.FINISHED) return;
    //console.log("continue start: " + this.request.targetID)
    const site = Game.getObjectById(this.request.targetID) as AnyStructure;
    const tower = Game.getObjectById(this.request.assignedTo) as StructureTower;
    if (tower == null || site == null) {
      console.log("something went wrong")
    }
    if (tower.energy < tower.energyCapacity * .5) {
      this.request.status = TaskStatus.FINISHED;
      return;
    }
    var status = tower.repair(site);
    if (status == OK) {
      this.request.status = TaskStatus.FINISHED;
    }

    console.log(status)
    
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
      StructureTaskQueue.addPendingRequest(new TowerRepairRequest(roomName, target.id));
    }

  }
}
