import { StructureTaskRequest } from "tasks/StructureTaskRequest";
import { StructureTask } from "tasks/StructureTask";
import { StructureTaskQueue } from "../StructureTaskQueue";
import { TaskStatus } from "../Task";

export class TowerAttackRequest extends StructureTaskRequest {
  priority: number = 0
  name: string = "TowerAttack";
  maxConcurrent: number = 6;
  constructor(roomName: string, hostileID: string) {
    super(roomName, hostileID)
  }

}
export class TowerAttack extends StructureTask {

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
    let attackRequest = this.request as TowerAttackRequest;
    let hostile = Game.getObjectById(attackRequest.targetID) as Creep;
    // if(site.structureType == "rampart")  console.log("got a rampart!");
    let tower = Game.getObjectById(attackRequest.assignedTo) as StructureTower;
    //console.log("Tower: " + tower.structureType + " " + tower.owner)
    if (hostile == undefined || hostile.hits == 0) {
      console.log("he died!")
      this.request.status = TaskStatus.FINISHED;
      return;
    }
    tower.attack(hostile);
  }
  constructor(request: StructureTaskRequest) {
    super(request);
  }

  static addTask(roomName: string) {
    let room = Game.rooms[roomName];
    const targets = room.find(FIND_HOSTILE_CREEPS)

    //let sorted = targets.sort((a, b) => a.hits - b.hits);
    const sorted = _.sortBy(targets, t => t.hits)

    var maxConcurrent = new TowerAttackRequest(roomName, "").maxConcurrent;

    var currentCount = StructureTaskQueue.totalCount(roomName, "TowerAttack");
    console.log("current: " + currentCount + ", max: " + maxConcurrent)

    if (sorted.length == 0) return;
    for (var i = currentCount; i < maxConcurrent; ) {
      _.each(sorted, t => {
        StructureTaskQueue.addPendingRequest(new TowerAttackRequest(roomName, t.id))
        i++;
      });
    }
    //do {
     
    //  _.each(sorted, t => {

    //    StructureTaskQueue.addPendingRequest(new TowerAttackRequest(roomName, t.id))
    //    currentCount++;  
    //  });
    //} while (currentCount < maxConcurrent)
    

    //for (const id in sorted) {
    //  let thing = sorted[id];
    //  let taskInfo = new TowerAttackRequest(roomName, thing.id);
    //  if (StructureTaskQueue.totalCount(roomName, taskInfo.name) < taskInfo.maxConcurrent) {
    //    StructureTaskQueue.addPendingRequest(taskInfo);
    //  }
    //}
  }
}
