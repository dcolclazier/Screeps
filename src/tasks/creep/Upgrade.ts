import { CreepTask } from "tasks/CreepTask"
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "../CreepTaskQueue";
import * as utils from "utils/utils";

export class UpgradeRequest extends CreepTaskRequest {

    validRoles: CreepRole[] = ["ROLE_UPGRADER"]
    priority: number = 5;
    name: string = "Upgrade"
    maxConcurrent: number;
    constructor(roomName: string, targetRoomName: string, controllerID: string, maxPerRoom: number) {
        super(roomName, targetRoomName, controllerID, `🎇`);
        this.maxConcurrent = maxPerRoom
    }
}

export class Upgrade extends CreepTask {
    static taskName: string = "Upgrade";
    constructor(taskInfo: CreepTaskRequest) {
        super(taskInfo);
    }


    protected init(): void {
        super.init();
        if (this.request.status != "INIT") return;

        if (this.creep == null) {
            //console.log("it happened...")
            this.request.status = "FINISHED";
            return;
        }

        var room = Game.rooms[this.request.originatingRoomName];
        if (room.controller === undefined) throw new Error("Room or Controller was undefined in upgrade...");
        if (this.creep.carry.energy < this.creep.carryCapacity) this.fillup(room.name);
        else this.request.status = "PREPARE";
    }


    protected prepare(): void {
        super.prepare();
        if (this.request.status != "PREPARE") return;
        //we could be moving to target room.
        if (this.creep.room.name != this.request.targetRoomName) return;

        var room = Game.rooms[this.request.targetRoomName];
        if (room.controller === undefined) throw new Error("Room or Controller was undefined in upgrade...")

        if (this.creep.carry.energy < this.creep.carryCapacity) this.fillup(this.request.targetRoomName);
        else this.request.status = "IN_PROGRESS";
    }


    protected work(): void {
        super.work();
        if (this.request.status != "IN_PROGRESS") return;

        if (this.creep.room.name != this.request.targetRoomName || this.creep.carry.energy == 0) {
            this.request.status = "PREPARE";
            return;
        }

        

        let controller = <StructureController>Game.getObjectById(this.request.targetID);

        if (controller.sign == undefined || controller.sign.username != "KeyserSoze") {
            var result = this.creep.signController(controller, "The greatest trick the devil ever pulled was convincing the world he did not exist.");
            if (result == ERR_NOT_IN_RANGE) this.creep.travelTo(controller);
      }
      if (this.creep.upgradeController(controller) == ERR_NOT_IN_RANGE || this.creep.pos.getRangeTo(controller) > 1) {
            this.creep.travelTo(controller);
        }

    }


    private fillup(roomName: string): void {
        const room = Game.rooms[roomName];

        if (Object.keys(this.creep.carry).length > 1) {
            this.creep.drop(<ResourceConstant>_.findKey(this.creep.carry))
            return;
        }


        if (this.collectFromContainer(room.name)) return;

        if (this.collectFromDroppedEnergy(room.name)) return;
        if (this.collectFromTombstone(room.name)) return;
        if (this.collectFromStorage(room.name)) return;
        this.collectFromSource(room.name);
    }


    static addRequests(roomName: string): void {
        const room = Game.rooms[roomName];
        if (room == undefined) return;
        let controller = room.controller as StructureController;
        if (controller == undefined || !controller.my) return;

        var upgraderCount = global.creepManager.creeps(roomName, "ROLE_UPGRADER").length;
        if (controller == undefined || upgraderCount == 0) return;
        let tasksNeeded = upgraderCount - CreepTaskQueue.count(roomName, undefined, "Upgrade");
        if (tasksNeeded <= 0) return;

        for (let i = 0; i < tasksNeeded; i++) {
            CreepTaskQueue.addPendingRequest(new UpgradeRequest(roomName, roomName, controller.id, upgraderCount));
        }
    }
}

