import { StructureTask } from "tasks/StructureTask";
import { StructureTaskRequest } from "tasks/StructureTaskRequest";
import { StructureTaskQueue } from "tasks/StructureTaskQueue";
import { CreepTaskQueue } from "../CreepTaskQueue";

export class TowerRepairRequest extends StructureTaskRequest {

    validStructureTypes: StructureConstant[] = ["tower"];
    priority: number = 2;
    name: string = "TowerRepair";
    maxConcurrent: number = 6;
    static maxHitPoints: number = 3140000;
    constructor(roomName: string, siteID: string) {
        super(roomName, roomName, siteID)
    }

}
export class TowerRepair extends StructureTask {
    static taskName: string = "TowerRepair";

    protected init(): void {
        super.init();
        if (this.request.status != "INIT") return;
        //console.log("Repair INIT");
        var room = Game.rooms[this.request.originatingRoomName] as Room;
        const tower = <TowerMemory>_.find(global.roomManager.towers(this.request.originatingRoomName), t => t.id == this.request.assignedToID)
        //const tower = <TowerMemory>room.memory.structures[this.request.assignedToID];
        tower.currentTask = TowerRepair.taskName + this.request.id;
        tower.towerMode = "REPAIR";
        this.request.status = "PREPARE";
    }
    protected prepare(): void {
        super.prepare();
        if (this.request.status != "PREPARE") return;


        this.request.status = "WORK"
    }
    protected work(): void {
        super.work();
        if (this.request.status != "WORK") return;

        const site = Game.getObjectById(this.request.targetID) as AnyStructure;

        const tower = Game.getObjectById(this.request.assignedToID) as StructureTower;

        if (tower.energy < tower.energyCapacity * .5) {
            this.request.status = "FINISHED";
            return;
        }
        var status = tower.repair(site);
        if (status == OK) {
            this.request.status = "FINISHED";
        }

    }
    protected finish() {
        super.finish();
        if (this.request.status != "FINISHED") return;

        var room = Game.rooms[this.request.originatingRoomName] as Room;
        //const tower = <TowerMemory>room.memory.structures[this.request.assignedToID];
        const tower = <TowerMemory>_.find(global.roomManager.towers(this.request.originatingRoomName),
            t => t.id == this.request.assignedToID);

        tower.currentTask = "";
        tower.towerMode = "IDLE"
    }

    constructor(taskInfo: StructureTaskRequest) {
        super(taskInfo);
    }
    static addRequests(roomName: string) {
        const room = Game.rooms[roomName];
      if (room == undefined) return;

        const targets = room.find(FIND_STRUCTURES)
          .filter(structure => structure.hits < structure.hitsMax * .75
            && structure.hits < (room.energyAvailable < room.energyCapacityAvailable ? 50000 : TowerRepairRequest.maxHitPoints)
                && structure.pos.findInRange(FIND_FLAGS, 0).filter(f => f.color == COLOR_YELLOW && f.secondaryColor == COLOR_YELLOW).length == 0);

        const sorted = _.sortBy(targets, t => t.hits);
        var count = StructureTaskQueue.count(roomName, TowerRepair.taskName);
        var i = 0;
        for (var id in sorted) {
            if (i + count == 6) break;
            var target = sorted[id];
            StructureTaskQueue.addPendingRequest(new TowerRepairRequest(roomName, target.id));
            i++;
        }


    }
}
