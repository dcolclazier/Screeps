import * as utils from "utils/utils"

export abstract class StructureTaskRequest implements ITaskRequest {
  id: string;
  status: TaskStatus = "PENDING";
  category: TaskCategory = "STRUCTURE";
  targetID: string;
  targetRoomName: string;
  originatingRoomName: string;
  assignedToID: string = "";

  abstract priority: number;
  abstract validStructureTypes: StructureConstant[];
  abstract name: string;
  //status: TaskStatus;
  //abstract name: string;
  //abstract priority: number;
  //targetID: string;
  //requestingRoomName: string;
  //targetRoomName: string;
  //assignedTo: string = "";
  //abstract maxConcurrent: number;
  //isCreepTask: boolean = false;
  constructor(originatingRoomName: string, targetRoomName: string, targetID: string = "") {
    this.targetRoomName = targetRoomName;
    this.originatingRoomName = originatingRoomName;
    this.targetID = targetID;
    this.id = utils.uniqueID();
  }
}
//export abstract class StructureTaskRequest implements ITaskRequest {
//  status: TaskStatus;
//  abstract name: string;
//  abstract priority: number;
//  targetID: string;
//  requestingRoomName: string;
//  targetRoomName: string;
//  assignedTo: string = "";
//  abstract maxConcurrent: number;
//  isCreepTask: boolean = false;
//  constructor(roomName: string, targetID: string = "", targetRoomstatic name: string = "") {
//    this.targetRoomName = targetRoomName == "" ? roomName : targetRoomName;
//    this.requestingRoomName = roomName;
//    this.targetID = targetID;
//    this.status = "PENDING"
//  }
//}
