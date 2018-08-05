import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "tasks/CreepTaskQueue";

export class ScoutRequest extends CreepTaskRequest {
  priority: number = 2;
  requiredRole: CreepRole[] = ["ROLE_SCOUT"];
  name = "Scout";
  maxConcurrent = 3;
  maxPerRoom = 1;
  claiming: boolean = false;
  reserving: boolean = false;
  constructor(sourceRoomName: string, targetRoomName: string, claiming: boolean = false, reserving: boolean = false) {
    super(sourceRoomName, `👀`, targetRoomName, targetRoomName);
    this.claiming = claiming;
    this.reserving = reserving;
  }
}


export class Scout extends CreepTask {

  protected init(): void {
    super.init();
    this.request.status = "PREPARE";
  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status == "FINISHED") return;

    //var scoutFlagID = this.request.targetID;
    //var flags = Game.flags;
    //var ourFlag = flags[scoutFlagID] as Flag;
    //if (ourFlag == undefined) {
    //  throw Error("Flag was undefined?")
    //}

    //var targetPos = ;
    if (this.creep.room.name != this.request.targetRoomName) {
      this.creep.travelTo(new RoomPosition(25, 25, this.request.targetRoomName));
    }
    else {
      this.request.status = "IN_PROGRESS";
    }

  }
  protected continue(): void {
    super.continue();
    if (this.request.status == "FINISHED") return;
    const creep = Game.creeps[this.request.assignedTo];
    var req = this.request as ScoutRequest;
    //creep.say("got here!");
    var controller = creep.room.controller as StructureController;
    if (controller == undefined) throw new Error("Can't put a claim flag in a room w/o a controller... derp");

    var result = req.claiming ? creep.claimController(controller)
      : req.reserving ? creep.reserveController(controller)
      : OK;
    if (result == ERR_NOT_IN_RANGE) {
      creep.moveTo(controller)
    }

  }

  static addRequests(roomName: string): void {

    //var room = Game.rooms[this.creep.room.name];
    var flags = Game.flags;
    for (var id in flags) {
      var flag = flags[id] as Flag;
      //blue/blue = scout, blue/white  = claim
      if (flag.color == COLOR_BLUE) {
        var targetRoomName = flag.pos.roomName;
        var sourceRoomName = flag.name;

        if (sourceRoomName != roomName) continue;

        //var room = Game.rooms[targetRoomName];
        //if (room != undefined
        //  && room.controller != undefined
        //  && room.controller.reservation != undefined
        //  && room.controller.reservation.username == "KeyserSoze"
        //  && room.controller.reservation.ticksToEnd > 2000) {
        //  console.log("not adding scout request for " + roomName)
        //  continue;
        //}

        var request = new ScoutRequest(sourceRoomName, targetRoomName)
        var currentActive = CreepTaskQueue.active(roomName, request.name);
        var currentPending = CreepTaskQueue.pending(roomName, request.name);

        var count = 0;
        for (var i in currentActive) {
          var current = currentActive[i] as CreepTaskRequest;
          if (current.targetID == id) count++;
        }
        for (var i in currentPending) {
          var current = currentPending[i] as CreepTaskRequest;
          if (current.targetID == id) count++;
        }

        //console.log("Current Scout task count for " + roomName + ": " + count)
        if (count > 0) return;

        if (flag.secondaryColor == COLOR_BLUE) {
          request.claiming = true;
          CreepTaskQueue.addPendingRequest(request);
        }
        else if (flag.secondaryColor == COLOR_WHITE) {
          request.reserving = true;
          CreepTaskQueue.addPendingRequest(request);
        }
      }

    }

  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }

}
