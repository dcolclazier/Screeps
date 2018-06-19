import { ITaskRequest } from "./ITaskRequest";
export interface ITask
{
	request: ITaskRequest;
	run(): void;
}
