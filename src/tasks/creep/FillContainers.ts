import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTask } from "tasks/CreepTask";
import { CreepTaskQueue } from "tasks/CreepTaskQueue";
import { Traveler } from "Traveler";

export class FillContainersRequest extends CreepTaskRequest {
    name: string = "FillContainers";
    priority: number = 1;
    validRoles: CreepRole[] = ["ROLE_CARRIER"];
    maxConcurrent: number = 1;
    constructor(roomName: string, targetRoomName: string, restockID: string) {
        super(roomName, targetRoomName, restockID, `💰2`);
    }
}

export class FillContainers extends CreepTask {
    static taskName: string = "FillContainers";
    protected init(): void {
        super.init();
        if (!this.creep) this.request.status = "FINISHED";
        if (this.request.status != "INIT") return;

        if (Object.keys(this.creep.carry).length == 1) {
            this.request.status = "PREPARE"
        }

    }

    protected prepare(): void {
        super.prepare();
        if (this.request.status != "PREPARE") return;
        //const restockInfo = this.request as FillStorageRequest;
        var room = Game.rooms[this.request.targetRoomName];

        if (this.creep.carry.energy == this.creep.carryCapacity) {
            this.request.status = "IN_PROGRESS";
            return;
        }
        this.fillup();

    }
    private fillup(): void {
        var room = Game.rooms[this.request.originatingRoomName];
        if (this.collectFromTombstone(room.name)) return;
        else if (this.collectFromDroppedEnergy(room.name)) return;
        else if (this.collectFromMasterLink(room.name)) return;
        else if (this.collectFromStorage(room.name)) return;
        else if (this.collectFromContainer(room.name)) return;
    }
    protected work(): void {
        super.work();
        if (this.request.status != "IN_PROGRESS") return;

        var room = Game.rooms[this.request.targetRoomName];
        if (this.creep.carry.energy == 0) {
            this.request.status = "PREPARE";
            return;
        }

        var cMem = _.find(global.roomManager.containers(this.request.targetRoomName), c => {
            var container = <StructureContainer>Game.getObjectById(c.id);
            return container.store.energy < container.storeCapacity
                && c.shouldRefill;
        });
        if (cMem == undefined) {
            this.request.status = "FINISHED";
            return;
        }
        var container = <StructureContainer>Game.getObjectById(cMem.id);

        const result = this.creep.transfer(container, RESOURCE_ENERGY)
        if (result == ERR_NOT_IN_RANGE) this.creep.travelTo(container);
        else this.request.status = "FINISHED";

    }
    constructor(taskInfo: CreepTaskRequest) {
        super(taskInfo);
    }
    static addRequests(roomName: string) {

        const room = Game.rooms[roomName];
        if (room == undefined) return;
        const roomMem = room.memory as OwnedRoomMemory;

        const containers = global.roomManager.containers(roomName).filter(cm => {
            var cont = <StructureContainer>Game.getObjectById(cm.id);
            return cont.store.energy < (cont.storeCapacity / 2)
                && cm.shouldRefill;
        });

        if (containers.length == 0) return;

        let existingTaskCount = CreepTaskQueue.count(roomName, undefined, "FillContainers");
        let maxConcurrentCount = 1; //todo

        _.forEach(containers, c => {
            let request = new FillContainersRequest(roomName, roomName, c.id);
            if (existingTaskCount < maxConcurrentCount) {
                CreepTaskQueue.addPendingRequest(request)
            }
        })

    }
}
