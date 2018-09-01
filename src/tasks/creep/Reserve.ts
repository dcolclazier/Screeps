import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "tasks/CreepTaskQueue";
import * as utils from "utils/utils";
import { OwnerName } from "utils/memory";

export class ReserveRequest extends CreepTaskRequest {

  priority: number = 2;
  validRoles: CreepRole[] = ["ROLE_RESERVER"];
  name = "Reserve";

  static maxPerRoom: number = 1;
  reserverMode: ReserverMode;

  constructor(originatingRoomName: string, targetRoomName: string, reserverMode: ReserverMode) {
    super(originatingRoomName, targetRoomName, targetRoomName, `👀`);

    this.reserverMode = reserverMode;
  }
}
export class Reserve extends CreepTask {
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
    const room = Memory.rooms[this.request.targetRoomName] as RemoteHarvestRoomMemory;
    if (this.creep == null) {
      this.request.status = "FINISHED";
      return;
    }
    room.assignedReserver = this.creep.name;
  }
  static taskName: string = "Reserve";

  protected init(): void {
    super.init();
    if (this.request.status != "INIT") return;

    if (this.creep.room.name == this.request.targetRoomName) {
      if ((this.creep.pos.x >= 1 && this.creep.pos.x <= 48) && (this.creep.pos.y >= 1 && this.creep.pos.y <= 48))
        this.request.status = "PREPARE";
      else this.creep.moveTo(new RoomPosition(25, 25, this.request.targetRoomName));
    }
    else this.creep.moveTo(new RoomPosition(25, 25, this.request.targetRoomName));
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status != "PREPARE") return;

    const controller = this.creep.room.controller as StructureController;
    this.creep.moveTo(controller);

    if (this.creep.pos.getRangeTo(controller) == 1) {
      this.request.status = "WORK";
    }
  }
  protected work(): void {
    super.work();
    if (this.request.status != "WORK") return;

    var roomMem = Memory.rooms[this.request.targetRoomName] as RemoteHarvestRoomMemory;

    if (roomMem.sourceCount == 0) {
      var room = Game.rooms[this.request.targetRoomName] as Room;
      roomMem.sourceCount = room.find(FIND_SOURCES).length;
    }


    //global.roomManager.sources(this.request.targetRoomName);
    //global.roomManager.containers(this.request.targetRoomName);

    const request = <ReserveRequest>this.request;
    const controller = this.creep.room.controller as StructureController;

    let result = 0;
    switch (request.reserverMode) {
      case "CLAIM": result = this.creep.claimController(controller); break;
      case "RESERVE": result = this.creep.reserveController(controller); break;
    }
    if (result == ERR_NOT_IN_RANGE) this.creep.travelTo(controller);

  }
  protected finish(): void {
    const room = Memory.rooms[this.request.targetRoomName] as RemoteHarvestRoomMemory;
    room.assignedReserver = "";
  }

  static addRequests(roomName: string): void {

    var roomMem = Memory.rooms[roomName] as RemoteHarvestRoomMemory;
    if (roomMem == undefined || roomMem.baseRoomName == undefined) return;
    if (roomMem.roomType != "REMOTE_HARVEST") return;
    const currentTasks = CreepTaskQueue.getTasks(roomMem.baseRoomName, roomName, this.taskName);
    if (currentTasks.length > 0) return;

    var reservers = global.creepManager.creeps(roomMem.baseRoomName, "ROLE_RESERVER", true);

    const room = Game.rooms[roomName];
    if (room != undefined) {
      var controller = room.controller;
      if (controller != undefined && controller.reservation != undefined) {
        if (controller.reservation.username == OwnerName && controller.reservation.ticksToEnd > 2500 && reservers.length == 0) {
          return;
        }
      }
    }

    if (Game.creeps[roomMem.assignedReserver] == undefined) {
      roomMem.assignedReserver = "";
    }
    if (roomMem.assignedReserver == "" && currentTasks.length == 0) {
      CreepTaskQueue.addPendingRequest(new ReserveRequest(roomMem.baseRoomName, roomName, "RESERVE"))
    }


  }


}
