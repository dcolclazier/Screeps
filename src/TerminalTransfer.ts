import { CreepTask } from "tasks/CreepTask";
import { StructureTaskQueue } from "tasks/StructureTaskQueue";
import { CreepTaskQueue } from "tasks/CreepTaskQueue";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";

export class TerminalTransferStartRequest extends CreepTaskRequest {
    priority: number = 1.5;
    validRoles: CreepRole[] = ["ROLE_CARRIER"];
    name: string = "TerminalTransferStart";
    resourceType: ResourceConstant;
    amount: number;
    toTerminalID: string;
    fromTerminalID: string;
    fromStorageID: string;

    currentAmount: number = 0;
    transactionCost: number;

    constructor(originatingRoomName: string, targetRoomName: string, resourceType: ResourceConstant, amt: number) {
        super(originatingRoomName, targetRoomName, "", "?");

        const fromRoom = Game.rooms[originatingRoomName];
        const toRoom = Game.rooms[targetRoomName];

        if (!fromRoom.terminal || !toRoom.terminal) {
            throw new Error("Cant add a terminal transfer start request with rooms that have no terminals.");
        }
        if (!fromRoom.storage) {
            throw new Error("Cant add a terminal transfer start request with original room that has no storage.");
        }
        this.fromStorageID = fromRoom.storage.id;
        this.fromTerminalID = fromRoom.terminal.id
        this.toTerminalID = toRoom.terminal.id
        this.resourceType = resourceType;
        this.transactionCost = Game.market.calcTransactionCost(amt, originatingRoomName, targetRoomName);
        this.amount = amt + this.transactionCost;
    }

}
export class TerminalTransferFinishRequest extends CreepTaskRequest {
    priority: number = .9;
    validRoles: CreepRole[] = ["ROLE_CARRIER"];
    name: string = "TerminalTransferFinish";
    resourceType: ResourceConstant;
    amount: number;
    currentAmount: number = 0;

    constructor(originatingRoomName: string, resourceType: ResourceConstant, amt: number) {
        super(originatingRoomName, originatingRoomName, "", "?");

        const room = Game.rooms[originatingRoomName];

        if (!room.terminal) {
            throw new Error("Cant add a terminal transfer finish request with room that have no terminals.");
        }
        if (!room.storage) {
            throw new Error("Cant add a terminal transfer finish request with room that has no storage.");
        }
        this.resourceType = resourceType;
        this.amount = amt;
    }

}

export class TerminalTransferFinish extends CreepTask {
    static taskName: string = "TerminalTransferFinish";

    protected init() {
        if (this.request.status != "INIT") return;
        this.request.status = "PREPARE"
    }

    protected prepare() {
        const room = Game.rooms[this.request.originatingRoomName];

        if (this.creep == undefined) {
            this.request.status = "PENDING";
        }

        if (!room || !room.terminal || !room.storage) {
            console.log("None available - undefined");
            this.request.status = "FINISHED";
        }
        if (this.request.status != "PREPARE") return;

        const request = <TerminalTransferFinishRequest>this.request;

        var amountLeft = request.amount - request.currentAmount;
        var roomFor = this.creep.carryCapacity - _.sum(this.creep.carry);


        var toGrab = Math.min(roomFor, amountLeft)
        var amountAvail = (<StructureTerminal>room.terminal).store[request.resourceType];
        if (amountAvail == undefined || amountAvail == 0) {
            this.request.status = "FINISHED";
            return;
        }
        toGrab = Math.min(toGrab, amountAvail);

        var result = this.creep.withdraw(<StructureTerminal>room.terminal, request.resourceType, toGrab);
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(<StructureTerminal>room.terminal);
        }
        else if (result == OK) {
            this.request.status = "IN_PROGRESS";
            request.currentAmount += toGrab;
            if (request.currentAmount >= request.amount) {
                this.request.status = "FINISHED";
            }
        }
       
    }

    protected work() {
        const room = Game.rooms[this.request.originatingRoomName];
        const request = <TerminalTransferFinishRequest>this.request;
        if (!room || !room.terminal || !room.storage) {
            console.log("None available - undefined");
            this.request.status = "FINISHED";
        }
        else if (this.creep.carry[request.resourceType] == 0) {
            this.request.status = "PREPARE";
        }
        else if (this.creep == undefined) {
            this.request.status = "PENDING";
        }
        if (this.request.status != "IN_PROGRESS") return;
        const storage = room.storage as StructureStorage;
        

        if (this.creep.transfer(storage, request.resourceType) == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(storage);
        }
        
        
    }

    
}


export class TerminalTransferStart extends CreepTask {
    static taskName: string = "TerminalTransferStart";

    protected init(): void {
        super.init();
        if (this.creep == undefined) {
            this.request.status = "PENDING";
        }
        if (this.request.status != "INIT") return;
        const request = <TerminalTransferStartRequest>this.request;


        const fromTerminal = Game.getObjectById(request.fromTerminalID) as StructureTerminal;
        const toTerminal = Game.getObjectById(request.toTerminalID) as StructureTerminal;

        const fromStorage = Game.getObjectById(request.fromStorageID) as StructureStorage;
        if (!fromTerminal || !fromStorage || !toTerminal) {
            //error!
            console.log("ERROR! !!! !!!");
            this.request.status = "FINISHED";
            return;
        }

        var availableAmount = fromStorage.store[request.resourceType];
        if (availableAmount == undefined) {
            console.log("None available - undefined");
            this.request.status = "FINISHED";
            return;
        }

        var amountLeft = request.amount - request.currentAmount;
        if (amountLeft <= 0) {
            this.request.status = "FINISHED";
            return;
        }

        if (availableAmount < amountLeft) {
            console.log("cant transfer resource without at least twice the amount in the original storage.");
            this.request.status = "PENDING";
            return;
        }
        if (_.sum(this.creep.carry) == this.creep.carryCapacity) {

            this.request.status = "PREPARE";
            return;
        }
        else {
            if (this.creep.withdraw(fromStorage, request.resourceType) == ERR_NOT_IN_RANGE) {
                this.creep.travelTo(fromStorage);
            }
        }
    }
    protected prepare(): void {
        super.prepare();
        if (this.creep == undefined) {
            this.request.status = "PENDING";
        }
        if (this.request.status != "PREPARE") return;
        const request = <TerminalTransferStartRequest>this.request;

        var amountCarried = this.creep.carry[request.resourceType];
        if (amountCarried == undefined || amountCarried == 0) {
            this.request.status = "INIT";
            return;
        }

        var amountRemaining = request.amount - request.currentAmount;
        var amountToTransfer = Math.min(amountCarried, amountRemaining);

        const fromTerminal = Game.getObjectById(request.fromTerminalID) as StructureTerminal;
        if (fromTerminal == undefined) {
            console.log("terminal was undefined in work...");
            this.request.status = "FINISHED";
            return;
        }

        var result = this.creep.transfer(fromTerminal, request.resourceType, amountToTransfer);
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(fromTerminal);
        }
        if (result == OK) {
            request.currentAmount += amountToTransfer;
            if (request.currentAmount >= request.amount) {
                this.request.status = "IN_PROGRESS";
            }
            
        }

    }
    protected work(): void {
        super.work();
        const request = <TerminalTransferStartRequest>this.request;
        
        if (request.status != "IN_PROGRESS") return;

        var fromTerminal = Game.getObjectById(request.fromTerminalID) as StructureTerminal;
        if (fromTerminal == undefined) {
            console.log("ERROR - source terminal undefined, finishing task.");
            this.request.status = "FINISHED";
            return;
        }

        //var toTerminal = Game.getObjectById(request.toTerminalID) as StructureTerminal;
        //if (toTerminal == undefined) {
        //    console.log("ERROR - target terminal undefined, finishing task.");
        //    this.request.status = "FINISHED";
        //    return;
        //}

        var result = fromTerminal.send(request.resourceType, request.amount - request.transactionCost, request.targetRoomName);
        if (result != OK) {
            console.log("ERROR - send result: " + result);
        }
        else {
            this.request.status = "WIND_DOWN"
        }
       

    }
    protected windDown(): void {
        super.windDown();
        if (this.request.status != "WIND_DOWN") return;
        //const request = this.request as TerminalTransferStartRequest

        //CreepTaskQueue.addPendingRequest(new TerminalTransferFinishRequest(this.request.targetRoomName, request.resourceType, request.amount - request.transactionCost));
        this.request.status = "FINISHED";

    }
   
    static addRequests(roomName: string): void {

        const room = Game.rooms[roomName];
        if (room == undefined) return;
        const storage = room.storage;
        if (storage == undefined) return;

        if (storage.store.energy < 50000) {
            var currentStart = CreepTaskQueue.getTasks(undefined, roomName, "TerminalTransferStart");
            var currentFinish = CreepTaskQueue.getTasks(undefined, roomName, "TerminalTransferFinish");
            if (currentStart.length > 0 || currentFinish.length > 0) return;

            let bestStorageRoom: string = ""
            let bestStorageCount: number = 0;
            _.forEach(Game.rooms, room => {
                if (room.storage != undefined && room.name != roomName) {
                    if (room.storage.store.energy > bestStorageCount) {
                        bestStorageRoom = room.name;
                        bestStorageCount = room.storage.store.energy;
                    }
                }
            });
            if (bestStorageRoom == "") return;
            if (bestStorageCount < 100000) return;



            CreepTaskQueue.addPendingRequest(new TerminalTransferStartRequest(bestStorageRoom, roomName, RESOURCE_ENERGY, 25000));
        }

    }
}
