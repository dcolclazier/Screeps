import { CreepMemory } from "utils/memory";
import { CreepRole } from "utils/utils";
import * as utils from "utils/utils"

export class CreepManager
{

 

  
  
	static trySpawnCreep(spawn: StructureSpawn, bodyParts: BodyPartConstant[], role: CreepRole)
	{
		let spawned: boolean = false;
		if (!spawned)
		{
			if (this.spawnCreep(spawn, bodyParts, role) === OK)
			{
				spawned = true;
			}
		}
		return spawned;

	}
	private static spawnCreep(spawn: StructureSpawn, bodyParts: BodyPartConstant[], role: CreepRole): number
	{
		let uuid: number = Memory.uuid;
		let creepName: string = spawn.room.name + "-" + utils.getRoleString(role) + "-" + (uuid + 1);
		let status: number | string = spawn.spawnCreep(bodyParts, creepName, { dryRun: true });
		status = _.isString(status) ? OK : status;

		while(status == -3){
			uuid++;
			creepName = spawn.room.name + "-" + utils.getRoleString(role) + "-" + (uuid + 1);
			status = spawn.spawnCreep(bodyParts, creepName, { dryRun: true });
			status = _.isString(status) ? OK : status;
		}

		if (status === OK && spawn.spawning == null)
		{
			Memory.uuid = uuid + 1;
			const creepName: string = spawn.room.name + "-" + utils.getRoleString(role) + "-" + uuid;

			const memory: CreepMemory =
			{
				spawnID: spawn.id,
				idle: true,
				currentTask: "",
				alive: true,
				role: role
			};

			console.log("Started creating new creep: " + creepName);

			status = spawn.spawnCreep(bodyParts, creepName, { memory: memory });

			return _.isString(status) ? OK : status;
		}
		else
		{
			//console.log("Coudldn't spawn: " + Utils.errorToString(status))
			// if (Config.ENABLE_DEBUG_MODE && status !== ERR_NOT_ENOUGH_ENERGY)
			// {
			// 	log.info("Failed creating new creep: " + status);
			// }

			return status;
		}
	}
}
