//import { CreepTaskRequest } from "tasks/CreepTaskRequest";
//import { CreepTask } from "tasks/CreepTask";
//import { CreepTaskQueue } from "tasks/CreepTaskQueue";

//export class RemoteUpgradeRequest extends CreepTaskRequest {
//  priority: number = 2;
//  validRoles: CreepRole[] = ["ROLE_REMOTE_UPGRADER"];
//  name = "RemoteUpgrade";
//  maxConcurrent = 3;
//  constructor(roomName: string, remoteControllerID: string) {
//    super(roomName, `👀2`, remoteControllerID);
//  }
//}
//export class RemoteUpgrade extends CreepTask {

//  protected init(): void {
//    super.init();
//    if (this.request.status == "FINISHED") return;

//    var controller = Game.getObjectById(this.request.targetID) as StructureController;
//    if (this.creep.room.name == controller.pos.roomName) {
//      this.request.status = "PREPARE";
//    }
//    else {
//      if (this.creep.room.name == controller.pos.roomName) {
//        console.log("prep time")
//        this.creep.moveTo(controller);
//        this.request.status = "PREPARE";
//      }
//      else this.creep.moveTo(controller);
//      if (this.creep.pos.roomName != controller.room.name || this.creep.room.name == controller.room.name && this.borderPosition(this.creep.pos)) {
//        console.log("it happened: " + this.creep.pos.roomName + ", " + this.creep.room.name)
//        this.creep.moveTo(new RoomPosition(25, 25, controller.room.name));
//      }


//    }

//  }
//  private borderPosition(pos: RoomPosition): boolean {
//    return (this.creep.pos.x * this.creep.pos.y === 0 || this.creep.pos.x === 49 || this.creep.pos.y === 49);
//  }

//  protected prepare(): void {
//    super.prepare();
//    if (this.request.status == "FINISHED") return;
//    var room = this.creep.room;
//    var roomMem = this.creep.room.memory as RoomMemory;
//    //if (room.energyAvailable < 1000) return;
//    if (this.creep.carry.energy < this.creep.carryCapacity) {

//      //if (this.collectFromContainer(room.name)) return;
//      //if (room.energyCapacityAvailable > 1300) return;
//      //if (this.collectFromDroppedEnergy(room.name)) return;
//      //if (this.collectFromTombstone(room.name)) return;
//      //if (this.collectFromStorage(room.name)) return;


//      this.collectFromSource(room.name);

//    }
//    else this.request.status = "IN_PROGRESS";

//  }
//  protected work(): void {
//    super.work();
//    if (this.request.status == "FINISHED") return;
//    if (this.creep.room.name != this.request.originatingRoomName) {
//      this.creep.moveTo(new RoomPosition(25, 25, this.request.originatingRoomName));
//      return;
//    }
//    if (this.creep.carry.energy == 0) {
//      this.request.status = "PREPARE";
//      return;
//    }
//    let controller = Game.getObjectById(this.request.targetID) as StructureController;
//    if (this.creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
//      this.creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
//    }

//  }

//  public addRequests(roomName: string): void {

//    //var room = Game.rooms[this.creep.room.name];
//    var flags = Game.flags;
//    for (var id in flags) {
//      var flag = flags[id];
//      if (flag.color == COLOR_BLUE && flag.secondaryColor == COLOR_BLUE) {
//        var room = flag.room as Room;
//        if (room == undefined) return;
//        var controller = room.controller as StructureController;
//        if (controller == undefined) return;
//        var request = new RemoteUpgradeRequest(roomName, controller.id);
//        let existingTaskCount = CreepTaskQueue.totalCount(roomName, request.name);
//        let maxConcurrentCount = request.maxConcurrent;
//        if (existingTaskCount < maxConcurrentCount) {
//          CreepTaskQueue.addPendingRequest(request);
//        }
//      }

//    }

//  }
//  constructor(taskInfo: CreepTaskRequest) {
//    super(taskInfo);
//  }

//}
