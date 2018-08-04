import { StructureTaskRequest } from "tasks/StructureTaskRequest";
import { StructureTask } from "tasks/StructureTask";
import { StructureTaskQueue } from "../StructureTaskQueue";

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
    this.request.status = "PREPARE";
  }
  protected prepare(): void {
    super.prepare();
    this.request.status = "IN_PROGRESS"
  }
  protected continue(): void {
    super.continue();
    if (this.request.status == "FINISHED") return;
    let attackRequest = this.request as TowerAttackRequest;
    let hostile = Game.getObjectById(attackRequest.targetID) as Creep;
    let tower = Game.getObjectById(attackRequest.assignedTo) as StructureTower;
    if (hostile == undefined || hostile.hits == 0) {
      this.request.status = "FINISHED";
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

    const sorted = _.sortBy(targets, t => t.hits)

    var maxConcurrent = new TowerAttackRequest(roomName, "").maxConcurrent;

    var currentCount = StructureTaskQueue.totalCount(roomName, "TowerAttack");

    if (sorted.length == 0) return;
    for (var i = currentCount; i < maxConcurrent; ) {
      _.each(sorted, t => {
        StructureTaskQueue.addPendingRequest(new TowerAttackRequest(roomName, t.id))
        i++;
      });
    }

  }
}
