import { m, CreepMemory, StructureMemory, RoomMemory, SmartStructure } from "utils/memory";


export function findSpawns(roomName: string, onlyNonSpawning: boolean = true)
{
	let room = Game.rooms[roomName];
	return room.find(FIND_MY_STRUCTURES, {
		filter: (structure: Structure) =>
		{
			if (structure.structureType == STRUCTURE_SPAWN)
			{
				let spawner = structure as StructureSpawn;
				m().spawns[spawner.id] = spawner
				return onlyNonSpawning ? spawner.spawning === null : true;
			}
			return false;
		}
	});
}
export function findIdleCreeps(roomName: string, role: CreepRole = CreepRole.ROLE_ALL): Creep[]
{
	return Game.rooms[roomName].find(FIND_MY_CREEPS, {
		filter: (creep: Creep) =>
		{
			let memory = (creep.memory as CreepMemory);
			return memory.idle && (memory.role == role || role == CreepRole.ROLE_ALL);
		}
	});
}
export function ildeCreepCount(roomName: string, role: CreepRole = CreepRole.ROLE_ALL)
{
	return findIdleCreeps(roomName, role).length;
}
export function findClosestContainer(roomName: string, targetID: string, fullOK: boolean, emptyOK: boolean): StructureContainer | undefined
{
	let target = Game.getObjectById(targetID);
	if (target == null)
	{
		console.log("container target was null.")
		return;
	}
	let roomContainers = findAllContainers(roomName)
		.sort((a, b) => a.pos.getRangeTo(target as any) - b.pos.getRangeTo(target as any));

	for (const id in roomContainers)
	{
		let container = roomContainers[id] as StructureContainer;
		if (container == null) continue;
		if (!fullOK && container.store.energy == container.storeCapacity) continue; //has room
		if (!emptyOK && container.store.energy == 0) continue; //can't be empty
		return container;
	}
	return undefined;
}
export function creepIDsByRole(roomName: string, role: CreepRole): string[]
{
	let room = Game.rooms[roomName];
	let creeps = room.find(FIND_MY_CREEPS) as Creep[];
	let found: string[] = [];
	for (const key in creeps)
	{
		if (creeps.hasOwnProperty(key))
		{
			const creep = creeps[key];
			const mem = creep.memory as CreepMemory;
			if (mem.role == role || role == undefined) found.push(creep.id);
		}
	}
	return found;
}
export function creepCount(roomName: string, role: CreepRole | undefined): number
{
	let creeps = Game.rooms[roomName].find(FIND_MY_CREEPS) as Creep[];
	if (role == undefined) return creeps.length;
	else
	{
		return creepIDsByRole(roomName, role).length
	}
}
export function roomSources(roomName: string): Source[]
{
	return Game.rooms[roomName].find(FIND_SOURCES) as Source[];
}
export function sourceCount(roomName: string)
{
	return roomSources(roomName).length;
}
export function findAllContainers(roomName: string): Array<StructureContainer>
{
	return Game.rooms[roomName].find(FIND_STRUCTURES).filter(i =>
	{
		return i.structureType == STRUCTURE_CONTAINER;
	}) as StructureContainer[];

}
export function findIdleSmartStructures(roomName: string): Array<SmartStructure>
{

	let roomMem = Game.rooms[roomName].memory as RoomMemory;
	let structs = roomMem.smartStructures;
	return structs.filter(struc =>
	{
		let mem = struc.memory as StructureMemory;
		return mem.idle;
	})

}
export function getRestockables(roomName: string): Array<AnyStructure>
{
	let room = Game.rooms[roomName];
	return room.find(FIND_STRUCTURES, {
		filter: (structure) =>
		{
			return (structure.structureType == STRUCTURE_EXTENSION
				|| structure.structureType == STRUCTURE_SPAWN)
				&& structure.energy < structure.energyCapacity;
		}
	});
}
export function getRole(creepName: string): CreepRole
{

	if (creepName.search(getRoleString(CreepRole.ROLE_MINER)) != -1) return CreepRole.ROLE_MINER;
	if (creepName.search(getRoleString(CreepRole.ROLE_WORKER)) != -1) return CreepRole.ROLE_WORKER;
	if (creepName.search(getRoleString(CreepRole.ROLE_UPGRADER)) != -1) return CreepRole.ROLE_UPGRADER;
	return CreepRole.ROLE_UNASSIGNED;
}
export const enum CreepRole
{
	ROLE_UNASSIGNED = 0,
	ROLE_ALL,
	// ROLE_BUILDER,
	ROLE_MINER,
	// ROLE_MINEHAULER,
	// ROLE_HEALER,
	// ROLE_FIGHTER,
	// ROLE_RANGER,
	// ROLE_CLAIMER,
	// ROLE_REMOTEMINER,
	// ROLE_REMOTEMINEHAULER,
	// ROLE_CUSTOMCONTROL,
	ROLE_WORKER,
	ROLE_UPGRADER,
	// ROLE_UPGRADETRANSPORT
}
export function getRoleString(job: CreepRole): string
{
	switch (job)
	{
		// case CreepRoles.ROLE_BUILDER: return "ROLE_BUILDER";
		case CreepRole.ROLE_MINER: return "ROLE_MINER";
		// case CreepRoles.ROLE_MINEHAULER: return "ROLE_MINEHAULER";
		// case CreepRoles.ROLE_HEALER: return "ROLE_HEALER";
		// case CreepRoles.ROLE_FIGHTER: return "ROLE_FIGHTER";
		// case CreepRoles.ROLE_RANGER: return "ROLE_RANGER";
		// case CreepRoles.ROLE_CLAIMER: return "ROLE_CLAIMER";
		// case CreepRoles.ROLE_REMOTEMINER: return "ROLE_REMOTEMINER";
		// case CreepRoles.ROLE_REMOTEMINEHAULER: return "ROLE_REMOTEMINEHAULER";
		// case CreepRoles.ROLE_CUSTOMCONTROL: return "ROLE_CUSTOMCONTROL";
		case CreepRole.ROLE_UPGRADER: return "ROLE_UPGRADER";
		case CreepRole.ROLE_WORKER: return "ROLE_WORKER";
		case CreepRole.ROLE_UNASSIGNED: return "ROLE_UNASSIGNED";
		case CreepRole.ROLE_ALL: return "ROLE_ALL";
		default: return "unknown role";
	}
}
export enum CantBuildReasons
{
	NotTheOwner = -1,
	NameAlreadyExists = -3,
	BuildingBusy = -4,
	NotEnoughEnergy = -6,
	InvalidArguments = -10,
	RCLNotHighEnough = -14

}
// export function hasEnergy(creepName: string) : boolean {
// 	let creep = Game.creeps[creepName];
// 	return creep.carry.energy > 0;
// }
// export function hasRoom(creepName: string) : boolean{
// 	let creep = Game.creeps[creepName];
// 	return creep.carry.energy < creep.carryCapacity;
// }
export function errorToString(job: CantBuildReasons): string
{
	switch (job)
	{
		case CantBuildReasons.NotTheOwner: return "You don't own this building...?";
		case CantBuildReasons.NameAlreadyExists: return "Name already exists...";
		case CantBuildReasons.BuildingBusy: return "Name already exists...";
		case CantBuildReasons.NotEnoughEnergy: return "You can't afford it!";
		case CantBuildReasons.InvalidArguments: return "Invalid arguments passed to spawnCreep";
		case CantBuildReasons.RCLNotHighEnough: return "Your RCL level is not high enough";
		default: return "unknown error";
	}
}



// export function sendCreepsHome(roomName: string, creeps: Creep[]): void
// {
// 	let spawn = findStructureSpawns(roomName)[0];

// 	console.log(`There are ${creeps.length} idle creeps.`)
// 	for (const creep of creeps)
// 	{
// 		let mem = creep.memory as CreepMemory;
// 		if (mem.idle) creep.moveTo(spawn);
// 	}
// }
