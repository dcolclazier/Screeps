import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "tasks/CreepTaskQueue";
import * as utils from "utils/utils";

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
  }
  static taskName: string = "Reserve";
  protected init(): void {
    super.init();
    this.request.status = "PREPARE";
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status != "PREPARE") return;

    if (this.creep.room.name == this.request.targetRoomName) {
      this.request.status = "IN_PROGRESS";
    }

  }
  protected work(): void {
    super.work();
    if (this.request.status != "IN_PROGRESS") return;

    const request = <ReserveRequest>this.request;
    const controller = this.creep.room.controller as StructureController;
    let result = 0;
    switch (request.reserverMode) {
      case "CLAIM": result = this.creep.claimController(controller); break;
      case "RESERVE": result = this.creep.reserveController(controller); break;
    }
    if (result == ERR_NOT_IN_RANGE) this.creep.travelTo(controller);

  }

  static addRequests(roomName: string): void {

    var blueFlags = utils.findFlags(undefined, COLOR_BLUE, roomName);
    if (blueFlags.length != 1) return;

    var reserveFlag = _.first(blueFlags);
    var originatingRoom = roomName;
    var targetRoomName = reserveFlag.pos.roomName;

    if (Game.rooms[originatingRoom] == undefined) throw Error("Originating room cannot be undefined... in Reserve::addrequests");

    var currentActive = CreepTaskQueue.activeTasks(originatingRoom, "Reserve", targetRoomName).length;
    var currentPending = CreepTaskQueue.count(originatingRoom, "Reserve", targetRoomName, "PENDING");

    if (currentActive + currentPending >= 1) return;

    var reserveMode: ReserverMode | undefined =
      reserveFlag.secondaryColor == COLOR_BLUE ? "CLAIM" :
        reserveFlag.secondaryColor == COLOR_WHITE ? "RESERVE" : undefined;

   
    if (reserveMode != undefined) {
      CreepTaskQueue.addPendingRequest(new ReserveRequest(originatingRoom, targetRoomName, reserveMode));
    }
    

  }
  

}
