export abstract class CreepTaskRequest implements ITaskRequest {
  status: TaskStatus;
  wingDing: string;
  isCreepTask: boolean = true;
  targetID: string;
  abstract name: string;
  requestingRoomName: string;
  targetRoomName: string;
  assignedTo: string = "";
  abstract priority: number;
  abstract requiredRole: CreepRole[];
  abstract maxConcurrent: number;
  constructor(roomName: string, wingDing: string, targetID: string = "", targetRoomName: string = "") {
    this.targetRoomName = targetRoomName == "" ? roomName : targetRoomName;
    this.targetID = targetID;
    this.requestingRoomName = roomName;
    this.wingDing = wingDing;
    this.status = "PENDING"
  }
}
