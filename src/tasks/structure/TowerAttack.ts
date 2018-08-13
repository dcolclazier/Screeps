import { StructureTaskRequest } from "tasks/StructureTaskRequest";
import { StructureTask } from "tasks/StructureTask";
import { StructureTaskQueue } from "../StructureTaskQueue";
import { roomManager } from "RoomManager";

export class TowerAttackRequest extends StructureTaskRequest {
  validStructureTypes: StructureConstant[] = ["tower"];
  priority: number = 0
  name: string = "TowerAttack";
  maxConcurrent: number = 6;
  constructor(roomName: string, hostileID: string) {
    super(roomName, roomName, hostileID)
  }

}
export class TowerAttack extends StructureTask {
  static taskName: string = "TowerAttack";
 
  protected windDown(): void {
    throw new Error("Method not implemented.");
  }

  protected init(): void {
    super.init();
    var room = Game.rooms[this.request.originatingRoomName] as Room;
    const tower = <TowerMemory>room.memory.structures[this.request.assignedToID];
    tower.currentTask = TowerAttack.taskName + this.request.id;

    this.request.status = "PREPARE";
  }
  protected prepare(): void {
    super.prepare();
    this.request.status = "IN_PROGRESS"
  }
  protected work(): void {
    super.work();
    if (this.request.status == "FINISHED") return;
    let attackRequest = this.request as TowerAttackRequest;
    let hostile = Game.getObjectById(attackRequest.targetID) as Creep;
    let tower = Game.getObjectById(attackRequest.assignedToID) as StructureTower;
    if (hostile == undefined || hostile.hits == 0) {
      this.request.status = "FINISHED";
      return;
    }
    var entrances = this.room.memory.baseEntranceRamparts.concat(this.room.memory.baseEntranceWalls);

    if (entrances.length > 0) {
      _.forEach(entrances, entrance => {
        var inRange = hostile.pos.inRangeTo(entrance.x, entrance.y, 3);
        if (inRange) tower.attack(hostile);
      });
    }
    else {
      var inRange = hostile.pos.inRangeTo(tower, 30);
      if (inRange) tower.attack(hostile);
    }
   

    //for (var i in entrances) {
    //  var e = entrances[i];
    //  if (e == undefined) continue;
    //  var range = e.getRangeTo(hostile);
    //  if (range < shortest) {
    //    shortest = range;
    //  }
    //}
    //if (shortest > 5) return;
    //console.log(shortest);
    //tower.attack(hostile);
  }
  protected finish() {
    super.finish();
    //var room = Game.rooms[this.request.originatingRoomName] as Room;
    //const tower = room.memory.towers[this.request.assignedToID];
    //tower.currentTask = "";
  }
  constructor(request: StructureTaskRequest) {
    super(request);
  }

  static addRequests(roomName: string) {
    let room = Game.rooms[roomName];
    const targets = room.find(FIND_HOSTILE_CREEPS)
    const sorted = _.sortBy(targets, t => t.hits)

    var maxConcurrent = new TowerAttackRequest(roomName, "").maxConcurrent;

    var currentCount = StructureTaskQueue.count(roomName, this.taskName);

    if (sorted.length == 0) return;
    for (var i = currentCount; i < maxConcurrent; ) {
      _.each(sorted, t => {
        StructureTaskQueue.addPendingRequest(new TowerAttackRequest(roomName, t.id))
        i++;
      });
    }

  }
}
