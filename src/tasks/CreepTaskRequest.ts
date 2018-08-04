export abstract class CreepTaskRequest implements ITaskRequest
{
	status: TaskStatus;
	wingDing: string;
	isCreepTask: boolean = true;
	targetID: string;
	abstract name: string;
	roomName: string;
	assignedTo: string = "";
	abstract priority: number;
	abstract requiredRole: CreepRole[];
	abstract maxConcurrent: number;
	constructor(roomName: string, wingDing: string, targetID: string = "")
	{
		this.targetID = targetID;
		this.roomName = roomName;
		this.wingDing = wingDing;
		this.status = "PENDING"
	}
}
