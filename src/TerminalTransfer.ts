import { CreepTask } from "tasks/CreepTask";
import { StructureTaskQueue } from "tasks/StructureTaskQueue";

export class TerminalTransferStartRequest extends CreepTaskRequest {
  priority: number = 1.5;
  validRoles: CreepRole[] = ["ROLE_CARRIER"];
  name: string = "TerminalTransferStart";
  resourceType: ResourceConstant;
  amount: number;
  toTerminalID: string;
  fromTerminalID: string;
  fromStorageID: string;

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
    this.amount = amt;
  }

}


export class TerminalTransferStart extends CreepTask {
  static taskName: string = "TerminalTransferStart";


  protected init(): void {
    if (this.request.status != "INIT") return;
  }
  protected prepare(): void {
    if (this.request.status != "PREPARE") return;
    const request = <TerminalTransferStartRequest>this.request;

    const fromTerminal = Game.getObjectById(request.fromTerminalID) as StructureTerminal;
    const toTerminal = Game.getObjectById(request.toTerminalID) as StructureTerminal;

    const fromStorage = Game.getObjectById(request.fromStorageID) as StructureStorage;
    if (!fromTerminal || !fromStorage || !toTerminal) {
      //error!
    }

    var currentAmount = fromTerminal.store[request.resourceType];
    var availableAmount = fromStorage.store[request.resourceType];
    if (availableAmount == undefined) {
      console.log("None available - undefined");
      this.request.status = "FINISHED";
      return;
    }


    if (currentAmount == undefined) {
      console.log("undefined resource???");
      currentAmount = 0;
    }
    var amountNeeded = request.amount - currentAmount;
    if (amountNeeded <= 0) {
      this.request.status = "FINISHED";
      return;
    }
      
    if (currentAmount < amountNeeded *2) {
      console.log("cant transfer resource without at least twice the amount in the original storage.");
      this.request.status = "FINISHED";
      return;
    }
    if (this.creep.carry[request.resourceType] == this.creep.carryCapacity) {
      this.request.status = "IN_PROGRESS";
      return;
    }
    else {
      if (this.creep.withdraw(fromStorage, request.resourceType, this.creep.carryCapacity) == ERR_NOT_IN_RANGE) {
        this.creep.travelTo(fromStorage);
      }
    }


  }
  protected work(): void {
    const request = <TerminalTransferStartRequest>this.request;
    if (request.status != "IN_PROGRESS") return;
    

    const fromTerminal = Game.getObjectById(request.fromTerminalID) as StructureTerminal;
    if (fromTerminal == undefined) {
      console.log("terminal was undefined in work...");
      this.request.status = "FINISHED";
      return;
    }
    if (this.creep.transfer(fromTerminal, request.resourceType, this.creep.carryCapacity) == ERR_NOT_IN_RANGE) {
      this.creep.travelTo(fromTerminal);
    }
    var amount = fromTerminal.store[request.resourceType];
    if (amount != undefined && amount > request.amount) {
      this.request.status = "FINISHED";

    }
    else if (this.creep.carry[request.resourceType] == 0) {
      this.request.status = "PREPARE"
    }
  }
  protected finish(): void {
    if (this.request.status != "FINISHED") return;
    //var nextStepRequest = new TerminalTransferRequest(request.originatingRoomName, request.targetRoomName, request.toTerminalID)
    //StructureTaskQueue.addPendingRequest(nextStepRequest);
  }

}
