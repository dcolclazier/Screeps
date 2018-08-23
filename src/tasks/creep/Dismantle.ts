import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTask } from "tasks/CreepTask";
import * as utils from "utils/utils"
import { CreepTaskQueue } from "tasks/CreepTaskQueue";

export class DismantleRequest extends CreepTaskRequest {
    priority: number = 1;
    validRoles: CreepRole[] = ["ROLE_WORKER", "ROLE_DISMANTLER"];
    name = "Dismantle";
    position: RoomPosition;
    maxConcurrent = 2;
    constructor(originatingRoomName: string, targetRoomName: string, siteID: string) {
        super(originatingRoomName, targetRoomName, siteID, `🚧2`);
        let obj = <HasPos>Game.getObjectById(siteID);
        this.position = obj.pos;
    }
}


export class Dismantle extends CreepTask {
    static taskName: string = "Dismantle";
    protected init(): void {
        super.init();
        this.request.status = "PREPARE";
    }

    protected prepare(): void {
        super.prepare();
        this.request.status = "IN_PROGRESS";
    }
    protected work(): void {
        super.work();

        if (this.request.status == "FINISHED") return;
        var specificRequest = this.request as DismantleRequest;
        const site = Game.getObjectById<AnyStructure>(this.request.targetID);
        if (site == null) {
            this.request.status = "FINISHED";
            var flag = _.first(Game.rooms[this.request.originatingRoomName]
                .lookForAt("flag", specificRequest.position.x, specificRequest.position.y)
                .filter(f => f.color == COLOR_YELLOW && f.secondaryColor == COLOR_YELLOW));
            flag.remove();
            return;
        }
        const result = this.creep.dismantle(site);

        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(site);
        }
        if (this.creep.carry.energy == this.creep.carryCapacity) {
            this.creep.drop(RESOURCE_ENERGY);
        }
    }

    static addRequests(roomName: string): void {

        var room = Game.rooms[roomName];
        var flags = _.filter(Game.flags, f => f.color == COLOR_YELLOW
            && f.secondaryColor == COLOR_YELLOW
            && f.pos.roomName == roomName);

        if (flags.length == 0) return;

        _.forEach(flags, flag => {
            let targetRoomName = flag.pos.roomName;
            let originatingRoomName = "";
            if (room.controller == undefined || !room.controller.my) {
                originatingRoomName = utils.closestOwnedRoom(targetRoomName);
            }
            else {
                originatingRoomName = roomName;
            }
            var test = room.lookForAt("structure", flag.pos.x, flag.pos.y);
            var structureType = flag.name.replace(/[0-9]/g, '');
            if (structureType == undefined) throw new Error("Structure type for flag was undefined");
            var dismantle = _.first(test.filter(t => t.structureType == structureType));
            if (dismantle == undefined) return;

            var current = CreepTaskQueue.getTasks(roomName, roomName, "Dismantle");
            if (current.length > 0) return;

            CreepTaskQueue.addPendingRequest(new DismantleRequest(originatingRoomName, targetRoomName, dismantle.id));


        })


    }
    constructor(taskInfo: CreepTaskRequest) {
        super(taskInfo);
    }
}
