//import { StructureTaskRequest } from "tasks/StructureTaskRequest";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepRole } from "utils/utils";

export const MemoryVersion = 0;
export function m(): GameMemory
{
	return Memory as any as GameMemory;
}
export interface GameMemory
{
	uuid: number;
	memVersion: number;
	initialized: boolean;
	creeps:
	{
		[name: string]: any;
	};

	flags:
	{
		[name: string]: any;
	};

	rooms:
	{
		[name: string]: RoomMemory;
	};

	spawns:
	{
		[name: string]: any;
	};
}


export interface RoomMemory
{
	harvestLocations: SmartSource[];
	//runningWorkerTasks: CreepTaskRequest[];
	activeWorkerRequests: { [index:string] : CreepTaskRequest};
	test: StructureContainer[];
	pendingWorkerRequests: CreepTaskRequest[];
	//pendingStructureRequests: StructureTaskRequest[];
	//activeStructureRequests: { [index: string]: StructureTaskRequest };
	activeWorkerTaskCount: number;
	activeStructureRequestCount: number;
	smartStructures: SmartStructure[];
}
export interface StructureMemory
{
	idle: boolean;
	alive: boolean;
	currentTask: string;

}
export function initRoomMemory(roomName: string): void
{
	let room = Game.rooms[roomName];
	const rm: RoomMemory = m().rooms[room.name];
	rm.harvestLocations = [];
	rm.test = [];
	rm.activeWorkerTaskCount = 0;
	rm.activeStructureRequestCount = 0;
	rm.activeWorkerRequests = {};
	rm.pendingWorkerRequests = [];
	//rm.activeStructureRequests = {};
	//rm.pendingStructureRequests = []
	rm.smartStructures = [];

}
export interface SmartStructure
{
	memory: StructureMemory;
	id: string;
}

export interface CreepMemory
{
	spawnID: string;
	alive: boolean | undefined;
	currentTask: string;
	idle: boolean;
	role: CreepRole
}
export function cleanupCreeps(): void
{
	for (const name in Memory.creeps)
	{
		if (!Game.creeps[name])
		{
			console.log("Clearing dead creeps from memory.")
			for (const roomName in Game.rooms)
			{
				let room = Game.rooms[roomName] as Room;
				let roomMemory = room.memory as RoomMemory;
				let sites = roomMemory.harvestLocations;
				for (const id in sites)
				{
					let site = sites[id];
					if (site.assignedTo == name)
					{
						console.log("unassiging harvest spot for " + name + " source: " + site.sourceID)
						site.assignedTo = null;
					}
				}
			}
			delete Memory.creeps[name];
		}
	}
}
export class SmartSource{
	sourceID: string;
	roomName: string;
	assignedTo: string | null = null;
	constructor(sourceID: string, roomName: string){
		this.sourceID = sourceID;
		this.roomName = roomName;
	}
}


