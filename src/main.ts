import { ErrorMapper } from "utils/ErrorMapper";
import * as Mem from "utils/memory";
import {RoomManager} from "roomManager";

const rm = new RoomManager();
let initialized = false;
function memoryInit()
{

	console.log("Initializing Game");
	delete Memory.flags;
	delete Memory.spawns;
	delete Memory.creeps;
	delete Memory.rooms;

	const mem = Mem.m();
	mem.creeps = {};
	mem.rooms = {};
	mem.spawns = {};

	mem.uuid = getTotalCreepCount();
	mem.memVersion = Mem.MemoryVersion;
}
function getTotalCreepCount() : number{
	let totalcreepCount = 0;
	for(const i in Game.rooms){
		const room: Room = Game.rooms[i];
		let creeps = room.find(FIND_MY_CREEPS);
		totalcreepCount += creeps.length;
	}
	return totalcreepCount;
}
function InitializeGame()
{
	if (Mem.m().memVersion === undefined ||
		Mem.m().memVersion !== Mem.MemoryVersion||
		(Mem.m().memVersion == 0 && !initialized))
	{
		initialized = true;
		memoryInit();
	}
	if (!Mem.m().uuid || Mem.m().uuid > 1000)
	{
		Mem.m().uuid = getTotalCreepCount();
	}
}

function mainLoop()
{
	InitializeGame();
	//console.log("main loop.")
	for (const i in Game.rooms)
	{
		const room: Room = Game.rooms[i];
		let mem = Mem.m() as Mem.GameMemory;
		let roomMemory = mem.rooms[room.name] as Mem.RoomMemory;
		if (roomMemory === undefined)
		{
			console.log(`Init room memory for ${room.name}.`);
			Memory.rooms[room.name] = {};
			Mem.initRoomMemory(room.name);
			roomMemory = mem.rooms[room.name] as Mem.RoomMemory;
		}

		rm.Run(room.name);
	}

	Mem.cleanupCreeps();
}


export const loop = ErrorMapper.wrapLoop(mainLoop);

