import * as utils from "utils/utils"

export abstract class CreepTaskRequest implements ITaskRequest {

  id: string;
  status: TaskStatus = "PENDING";
  category: TaskCategory = "CREEP";

  originatingRoomName: string = "";
  targetID: string;
  targetRoomName: string;
  
  assignedToID: string = "";
  //assignedToName: string = "";

  wingDing: string;

  abstract priority: number;
  abstract validRoles: CreepRole[];
  abstract name: string
  

  constructor(originatingRoomName: string, targetRoomName: string, targetID: string, wingDing: string) {
    this.targetRoomName = targetRoomName;
    this.targetID = targetID;
    this.originatingRoomName = originatingRoomName;
    this.wingDing = wingDing;
    this.status = "PENDING"
    this.id = utils.uniqueID();
  }
 
}



//export abstract class CreepTaskRequest implements ITaskRequest {
//  status: TaskStatus;
//  wingDing: string;
//  isCreepTask: boolean = true;
//  targetID: string;
//  abstract name: string;
//  requestingRoomName: string;
//  targetRoomName: string;
//  assignedTo: string = "";
//  abstract priority: number;
//  abstract validRoles: CreepRole[];
//  abstract maxConcurrent: number;

//  constructor(roomName: string, wingDing: string, targetID: string = "", targetRoomName: string = "") {
//    this.targetRoomName = targetRoomName == "" ? roomName : targetRoomName;
//    this.targetID = targetID;
//    this.requestingRoomName = roomName;
//    this.wingDing = wingDing;
//    this.status = "PENDING"

//  }
//}

