import { TaskStatus } from "tasks/Task";

export interface ITaskRequest
{
	name: string;
	priority: number;
	targetID: string;
	roomName: string;
  status: TaskStatus;
	assignedTo: string;
	maxConcurrent: number;
	isCreepTask: boolean;
}
