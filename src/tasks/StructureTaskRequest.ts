export abstract class StructureTaskRequest implements ITaskRequest {
  status: TaskStatus;
  abstract name: string;
  abstract priority: number;
  targetID: string;
  requestingRoomName: string;
  targetRoomName: string;
  assignedTo: string = "";
  abstract maxConcurrent: number;
  isCreepTask: boolean = false;
  constructor(roomName: string, targetID: string = "", targetRoomName: string = "") {
    this.targetRoomName = targetRoomName == "" ? roomName : targetRoomName;
    this.requestingRoomName = roomName;
    this.targetID = targetID;
    this.status = "PENDING"
  }
}
