export abstract class StructureTaskRequest implements ITaskRequest
{
	status: TaskStatus;
	abstract name: string;
	abstract priority: number;
	targetID: string;
	roomName: string;
	assignedTo: string = "";
	abstract maxConcurrent: number;
	isCreepTask: boolean = false;
	constructor(roomName: string, targetID: string = "")
	{
		this.roomName = roomName;
		this.targetID = targetID;
		this.status = "PENDING"
	}
}
