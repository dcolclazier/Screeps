import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "../CreepTaskQueue";

export class DefendRequest extends CreepTaskRequest {

    validRoles: CreepRole[] = ["ROLE_DEFENDER"]
    priority: number = 0;
    name = "Defend";
    maxConcurrent: number;
    constructor(roomName: string, targetRoomName: string, maxPerRoom: number) {
        super(roomName, targetRoomName, targetRoomName, `🎇`);
        this.maxConcurrent = maxPerRoom
    }
}

export class Defend extends CreepTask {
    public static taskName: string = "Defend";


    //northDefendPositionW6S43_1: RoomPosition = new RoomPosition(33, 4, "W6S43");
    //northDefendPositionW6S43_2: RoomPosition = new RoomPosition(33, 6, "W6S43");
    //northDefendPositionW6S43_3: RoomPosition = new RoomPosition(33, 7, "W6S43");

    protected init(): void {
        super.init();
        this.request.status = "PREPARE";
       
    }

    protected prepare(): void {
        super.prepare();
        if (this.request.status != "PREPARE") return;
        if (this.creep.room.name == this.request.targetRoomName) {
            if ((this.creep.pos.x >= 1 && this.creep.pos.x <= 48) && (this.creep.pos.y >= 1 && this.creep.pos.y <= 48))
                this.request.status = "IN_PROGRESS";
            else this.creep.moveTo(new RoomPosition(25, 25, this.request.targetRoomName));
        }
        else this.creep.moveTo(new RoomPosition(25, 25, this.request.targetRoomName));

    }
    protected work(): void {
        super.work();
        if (this.request.status != "IN_PROGRESS") return;

        
        var room = Game.rooms[this.request.targetRoomName];

        var roomMem = room.memory as OwnedRoomMemory;
        var enemies = room.find(FIND_HOSTILE_CREEPS).sort(e => e.hits);
        if (enemies.length == 0) {
            this.creep.moveTo(25, 25);
            return;
        }
        var lowest = _.first(enemies);
        if (this.creep.attack(lowest) == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(lowest);
        }
        if (this.creep.hits < this.creep.hitsMax) {
            this.creep.heal(this.creep);
        }
     

    }
    constructor(taskInfo: CreepTaskRequest) {
        super(taskInfo);
    }
    static addRequests(roomName: string): void {
        var roomMem = Memory.rooms[roomName] as RemoteHarvestRoomMemory;
        if (roomMem == undefined || roomMem.baseRoomName == undefined) return;

        const currentTasks = CreepTaskQueue.getTasks(roomMem.baseRoomName, roomName, this.taskName);
        if (currentTasks.length > 0) return;

        var defenders = global.creepManager.creeps(roomMem.baseRoomName, "ROLE_DEFENDER", true);


        if (Game.creeps[roomMem.assignedDefender] == undefined) {
            roomMem.assignedReserver = "";
        }
        if (roomMem.assignedReserver == "" && currentTasks.length == 0) {
            CreepTaskQueue.addPendingRequest(new DefendRequest(roomMem.baseRoomName, roomName, 1))
        }
    }
}
