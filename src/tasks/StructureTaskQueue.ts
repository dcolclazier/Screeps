import { StructureTaskRequest } from "tasks/StructureTaskRequest";


export class StructureTaskQueue {

    static removeTask(id: string): void {
        delete Memory.structureTasks[id];
    }

    static addPendingRequest(request: StructureTaskRequest): void {


        if (request == undefined) {
            console.log("In StructureTaskQueue.addPendingRequest, request was undefined");
            return;
        }
        if (Memory.structureTasks == undefined) {
            console.log("In StructureTaskQueue.addPendingRequest, creepTasks was undefined");
            return;
        }
        Memory.structureTasks[request.id] = request;
    }

    static count(roomName: string, taskName: string = "", status: TaskStatus = "ANY", structureType: StructureConstant | undefined = undefined): number {
        return StructureTaskQueue.getTasks(roomName, taskName, status, structureType).length;
    }

    static getTasks(roomName: string, taskName: string = "", status: TaskStatus = "ANY", structureType: StructureConstant | "source" | undefined = undefined): string[] {

        var matchingRequests = _.filter(Memory.structureTasks, req =>
            req.originatingRoomName == roomName &&
            (taskName == "" || req.name == taskName) &&
            (status == "ANY" || req.status == status) &&
            (structureType == undefined || _.includes(req.validStructureTypes, structureType)));
        return _.map(matchingRequests, request => request.id);
    }

    static activeTasks(roomName: string, taskName: string = "", targetID: string = "") {

        return _.filter(Memory.structureTasks, task =>
            task.originatingRoomName == roomName &&
            task.status != "PENDING" && task.status != "FINISHED" &&
            task.name == taskName || taskName == "" &&
            targetID == task.targetID || targetID == "");
    }

    static getTask(id: string): StructureTaskRequest | undefined {

        var request = Memory.structureTasks[id];
        if (request == undefined) {
            console.log("ERROR: Invalid Task ID (StructureTaskQueue.getTask)");
        }
        return request;
    }

    static assignRequest(structureID: string, originatingRoomName: string): void {

        const room = Memory.rooms[originatingRoomName];
        if (room == undefined) return;
        const structure = room.structures[structureID];

        if (structure == undefined) {
            console.log("ERROR: assignPendingRequest -> structure cannot be undefined!");
            return;
        }

        var nextTaskID = StructureTaskQueue.getNextTaskID(structureID, originatingRoomName, structure.pos);
        ////console.log(`Next Task ID: ${nextTaskID}`)
        if (nextTaskID == undefined) return;

        var nextTask = Memory.structureTasks[nextTaskID];
        if (nextTask == undefined) {
            console.log("ERROR: assignPendingRequest -> nextTask cannot be undefined!");
            return;
        }
        nextTask.assignedToID = structure.id;
        nextTask.status = "INIT";

        //console.log(`Next task ${nextTask.name} assigned to ${structure.structureType} - ${structure.id}`);
    }

  private static getNextTaskID(structureID: string, originatingRoomName: string, structurePosition: RoomPosition): string | undefined {

        //const structure = <OwnedStructure>Game.getObjectById(structureID);
        const room = Game.rooms[originatingRoomName];
        const structure = room.memory.structures[structureID];
        const tasks = StructureTaskQueue.getTasks(originatingRoomName, "", "PENDING", structure.type);

        if (tasks.length == 0) return undefined;

        const sortedByPriority = _.sortByAll(_.map(tasks, id => Memory.structureTasks[id]),
            [
              'priority',
              (<AnyStructure>Game.getObjectById(structure.id)).pos.getRangeTo(structurePosition)
               //structure.pos.getRangeTo(structurePosition)
            ]);
        if (sortedByPriority.length == 0) return undefined;

        return sortedByPriority[0].id;
    }
}


