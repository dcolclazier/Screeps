import { StructureTask } from "tasks/StructureTask";
import { StructureTaskRequest } from "tasks/StructureTaskRequest";
import { StructureTaskQueue } from "tasks/StructureTaskQueue";
import { TaskStatus } from "tasks/Task";


export class TowerRepairRequest extends StructureTaskRequest {
  priority: number = 2;
  name: string = "TowerRepair";
  maxConcurrent: number = 3;
  static maxHitPoints: number = 1000000;
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
    if (/*site.hits == site.hitsMax * .5 || */tower.energy < tower.energyCapacity * .5) {
      this.request.status = TaskStatus.FINISHED;
      return;
    }
    //console.log("repairing: " + site.id);
    var status = tower.repair(site);
    //console.log(status)
    //console.log("about to finish")
    this.request.status = TaskStatus.FINISHED;
  }
  // protected doWork(): void
  //{
  //	//if(Game.time % 4 != 0) return;
  //	let info = this.request as TowerRepairRequest;
  //	let site = Game.getObjectById(info.targetID) as AnyStructure;
  //	// if(site.structureType == "rampart")  console.log("got a rampart!");
  //	let tower = Game.getObjectById(info.assignedTo) as StructureTower;
  //	//console.log("Tower: " + tower.structureType + " " + tower.owner)
  //	if(tower == null || site == null){
  //		console.log("something went wrong")
  //	}
  //	if(site.hits == site.hitsMax || tower.energy < tower.energyCapacity*.5){
  //		this.finish();
  //		return;
  //	}
  //	tower.repair(site);
  //}
  constructor(taskInfo: StructureTaskRequest) {
    super(taskInfo);
  }
  static addTask(roomName: string) {
    const room = Game.rooms[roomName];
    const targets = room.find(FIND_STRUCTURES)
      .filter(structure => structure.hits < structure.hitsMax * .75 && structure.hits < TowerRepairRequest.maxHitPoints)

    const sorted = _.sortBy(targets, t => t.hits);
    //console.log("Sorted: " + sorted.map(s => s.id))
    //console.log("Non Sorted: " + targets.map(s => s.hits))
    var target = _.first(sorted);
    if (target != undefined) {
      StructureTaskQueue.addPendingRequest(new TowerRepairRequest(roomName, target.id));
    }
    //console.log("before: " + target.id);
    
    //_.each(sorted, target => StructureTaskQueue.addPendingRequest(new TowerRepairRequest(roomName, target.id)))
    //for (const id in sorted) {
    //  const repairTarget = sorted[id];
    //  const request = new TowerRepairRequest(roomName, repairTarget.id);
    //  StructureTaskQueue.addPendingRequest(request);
    //  //const existingTaskCount = StructureTaskQueue.totalCount(roomName, request.name);

    //  //if (existingTaskCount < request.maxConcurrent) {
    //  //  StructureTaskQueue.addPendingRequest(request);
    //  //}
    //}
  }
}
