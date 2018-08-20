import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";

export class DefendRequest extends CreepTaskRequest {

  validRoles: CreepRole[] = ["ROLE_DEFENDER"]
  priority: number = 0;
  name = "DEFEND";
  maxConcurrent: number;
  constructor(roomName: string, targetRoomName: string, controllerID: string, maxPerRoom: number) {
    super(roomName, targetRoomName, controllerID, `🎇`);
    this.maxConcurrent = maxPerRoom
  }
}

export class Defend extends CreepTask {
  public static taskName: string = "Defend";


  northDefendPositionW6S43_1: RoomPosition = new RoomPosition(33, 4, "W6S43");
  northDefendPositionW6S43_2: RoomPosition = new RoomPosition(33, 6, "W6S43");
  northDefendPositionW6S43_3: RoomPosition = new RoomPosition(33, 7, "W6S43");

  protected init(): void {
    super.init();
    this.request.status = "PREPARE";

  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status != "PREPARE") return;
    if (this.creep.room.name != this.request.targetRoomName) return;

    //var room = Game.rooms[this.request.requestingRoomName];
    //var roomMem = room.memory as RoomMemory;
    this.request.status = "IN_PROGRESS";
    //if (room.energyAvailable < 1000) return;
    //if (this.creep.carry.energy == 0) {

    //  if (this.collectFromContainer(room.name)) return;
    //  if (room.energyCapacityAvailable > 1300) return;
    //  if (this.collectFromDroppedEnergy(room.name)) return;
    //  if (this.collectFromTombstone(room.name)) return;
    //  if (this.collectFromStorage(room.name)) return;


    //  //this.collectFromSource(room.name);

    //}
    //else this.request.status = "IN_PROGRESS";
  }
  protected work(): void {
    super.work();
    if (this.request.status != "IN_PROGRESS") return;


    var room = Game.rooms[this.request.targetRoomName];

    var roomMem = room.memory as OwnedRoomMemory;
    var enemies = room.find(FIND_HOSTILE_CREEPS).sort(e => e.hits);
    var closestRampartToEn
    if (enemies.length == 0) {
      this.request.status = "FINISHED";
      return;
    }
    var lowest = _.first(enemies);
    if (this.creep.attack(lowest) == ERR_NOT_IN_RANGE) {
      this.creep.travelTo(lowest);
    }

    //const creep = Game.creeps[this.request.assignedTo];
    //if (this.creep.carry.energy == 0) {
    //  this.request.status = "PREPARE";
    //  return;
    //}
    //const info = this.request as UpgradeRequest
    //let controller = Game.getObjectById(info.targetID) as StructureController;
    //if (this.creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
    //  this.creep.travelTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
    //}

  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }
  static addRequests(roomName: string, maxPerRoom: number): void {
    //let controller = Game.rooms[roomName].controller as StructureController;
    //let request = new DefendRequest(roomName, controller.id, maxPerRoom);
    //let tasksNeeded = request.maxConcurrent - CreepTaskQueue.count(roomName, request.name);
    //for (let i = 0; i < tasksNeeded; i++) {
    //  CreepTaskQueue.addPendingRequest(request);
    //}
  }
}
