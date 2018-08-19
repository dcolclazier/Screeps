import { CreepTaskQueue } from "tasks/CreepTaskQueue";

export class CreepManager {

    //roomname::creepNames
    private _creeps: Record<string, string[]> = {};

    //private _creeps: Record<string, CreepDictionary> = {}
    public creeps(roomName: string): string[] {
        if (this._creeps[roomName] == undefined) {
            this.loadCreeps2(roomName);
        }
        return this._creeps[roomName];
    }

    public run(roomName: string) {
        //this.loadCreeps(roomName);

        this.loadCreeps2(roomName);
        this.spawnMissingCreeps(roomName);
    }
    private loadCreeps2(roomName: string) {
        if (this._creeps[roomName] == undefined) {
            console.log(`initializing creep dictionary for ${roomName}`);
            this._creeps[roomName] = [];
        }
        const room = Game.rooms[roomName];
        if (room == undefined) {
            console.log(`room ${roomName} was undefined in CreepManager.loadCreeps`)
            return;
        }
        const foundCreeps = room.find(FIND_MY_CREEPS);

        for (let id in foundCreeps) {
            const creep = foundCreeps[id];
            if (creep.memory === undefined || creep.memory.id === undefined) {
                console.log("it happened...")
                creep.memory = {
                    id: creep.id,
                    name: creep.name,
                    idle: true,
                    alive: true,
                    role: this.getRole(creep.name),
                    currentTask: "",
                    homeRoom: this.getHomeRoom(creep.name),
                    _trav: {},
                };
            }
            this._creeps[roomName].push(creep.name);
        }
    }

    //private loadCreeps(roomName: string) {

        
    //    if (this._creeps[roomName] == undefined) {
    //        console.log(`initializing creep dictionary for ${roomName}`);
    //        this._creeps[roomName] = {};
    //    }

    //    const room = Game.rooms[roomName];
    //    if (room == undefined) {
    //        console.log(`room ${roomName} was undefined in CreepManager.loadCreeps`)
    //        return;
    //    }

    //    const foundCreeps = room.find(FIND_MY_CREEPS);

    //    for (let id in foundCreeps) {
    //        let creep = foundCreeps[id];
    //        if (creep.memory === undefined || creep.memory.id === undefined) {
    //            creep.memory = {
    //                id: creep.id,
    //                name: creep.name,
    //                idle: true,
    //                alive: true,
    //                role: this.getRole(creep.name),
    //                currentTask: "",
    //                homeRoom: this.getHomeRoom(creep.name),
    //                _trav: {},
    //            };

    //        }
    //        this.setCreepMemory(creep.memory.homeRoom, creep.name, creep.memory);
    //        //this._creeps[roomName][creep.id] = creep.memory;
    //    }

    //}

    public deleteCreep(creepName: string): void {
        _.forEach(global.roomManager.sources(this.getHomeRoom(creepName)), source => {
            //console.log(source.assignedTo)
            if (_.includes(source.assignedTo, creepName)) {
                //console.log("unassiging harvest spot for " + creepName + " source: " + source)
                source.assignedTo = source.assignedTo.filter(s => s != creepName);
            }
        })
        delete Memory.creeps[creepName];
        var roomName = this.getHomeRoom(creepName);
        this._creeps[roomName] = this._creeps[roomName].filter(cName => cName != creepName);

        //delete this._creeps[this.getHomeRoom(creepName)][creepName];
    }
    // START OF BAD CODE _ SHOULD REFACTOR
    private spawnMissingCreeps(roomName: string) {

        if (this._creeps[roomName] == undefined) {
            this.loadCreeps2(roomName);
        }

        var energyLevel = global.roomManager.getEnergyLevel(roomName);
        this.spawnMissingMiners(roomName, energyLevel);
        this.spawnMissingWorkers(roomName, energyLevel);
        this.spawnMissingUpgraders(roomName, energyLevel);
        this.spawnMissingCarriers(roomName, energyLevel);
        this.spawnMissingReservers(roomName, energyLevel);
        this.spawnMissingRemoteUpgraders(roomName, energyLevel);
        this.spawnMissingDismantlers(roomName, energyLevel);
        //CreepManager.spawnMissingDefenders(roomName, energyLevel);
    }

    private getUpgraderBodyParts(energyLevel: number): BodyPartConstant[] {

        switch (energyLevel) {
            case 1: return [WORK, MOVE, MOVE, CARRY];
            case 2: return [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY]
            case 3: return [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY]
            case 4: return [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY]
            case 5: return [WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY]
            default: return [WORK, MOVE, MOVE, CARRY];
        }
    }
    private getDismantlerBodyParts(energyLevel: number): BodyPartConstant[] {
        switch (energyLevel) {
            case 1: return [WORK, MOVE, MOVE, CARRY];
            case 2: return [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY]
            case 3: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
            case 4: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
            case 5: return [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK]
            default: return [WORK, MOVE, MOVE, CARRY];
        }
    }
    private getDefenderBodyParts(energyLevel: number): BodyPartConstant[] {

        switch (energyLevel) {
            case 1: return [WORK, MOVE, MOVE, CARRY];
            case 2: return [ATTACK, ATTACK, MOVE, MOVE]
            case 3: return [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY]
            case 4: return [WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY]
            default: return [WORK, MOVE, MOVE, CARRY];
        }
    }
    private getRemoteUpgraderBodyParts(energyLevel: number): BodyPartConstant[] {

        switch (energyLevel) {
            case 1: return [WORK, MOVE, MOVE, CARRY];
            case 2: return [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY]
            case 3: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
            case 4: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY]
            default: return [WORK, MOVE, MOVE, CARRY];
        }
    }
    private getWorkerBodyParts(energyLevel: number): BodyPartConstant[] {

        switch (energyLevel) {
            case 1: return [WORK, MOVE, MOVE, CARRY];
            case 2: return [WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY, CARRY]
            case 3: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
            case 4: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
            case 5: return [WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY]
            default: return [WORK, MOVE, MOVE, CARRY];
        }
    }
    private getCarrierBodyParts(energyLevel: number): BodyPartConstant[] {

        switch (energyLevel) {
            case 1: return [MOVE, MOVE, CARRY, CARRY];
            case 2: return [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY]
            case 3: return [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY]
            case 4: return [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY]
            case 5: return [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY]
            default: return [WORK, MOVE, MOVE, CARRY];
        }
    }
    private getMinerBodyParts(energyLevel: number): BodyPartConstant[] {

        switch (energyLevel) {
            case 1: return [WORK, WORK, MOVE, MOVE];
            case 2: return [WORK, WORK, WORK, MOVE, MOVE, MOVE, MOVE]
            case 3: return [WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY]
            case 4: return [WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY]
            case 5: return [WORK, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE, MOVE, CARRY]
            default: return [WORK, WORK, MOVE, MOVE];
        }
    }
    private getReserverBodyParts(energyLevel: number): BodyPartConstant[] {

        switch (energyLevel) {
            case 1: return [MOVE, MOVE, MOVE];
            case 2: return [MOVE, MOVE, MOVE]
            case 3: return [CLAIM, MOVE,]
            case 4: return [CLAIM, MOVE,]
            case 5: return [MOVE, CLAIM, MOVE, CLAIM]
            default: return [MOVE, MOVE];
        }
    }

    private spawnMissingRemoteUpgraders(roomName: string, energyLevel: number) {
        const miners = this.creepCount(roomName, "ROLE_MINER");
        const workers = this.creepCount(roomName, "ROLE_WORKER");
        const carriers = this.creepCount(roomName, "ROLE_CARRIER");
        const upgraders = this.creepCount(roomName, "ROLE_UPGRADER");
        const roomMem = Game.rooms[roomName].memory as RoomMemory;
        const settings = roomMem.settingsMap[energyLevel];
        const currentRUCount = this.creepCountAllRooms("ROLE_REMOTE_UPGRADER");
        if (miners < settings.minersPerSource * 2
            || workers < settings.maxWorkerCount
            || carriers < settings.maxCarrierCount) return;

        var flags = _.filter(Game.flags, f => f.color == COLOR_BLUE && f.secondaryColor == COLOR_BLUE);

        if (flags.length == 0) return;
        const spawns = global.roomManager.findSpawns(roomName);
        let remoteUpgradersNeeded: number = 3 - currentRUCount;
        let spawned: number = 0;
        for (var i in spawns) {

            if (spawned < remoteUpgradersNeeded) {
                var spawn = spawns[i] as StructureSpawn;

                if (spawn.spawning) continue;

                this.trySpawnCreep(spawn, "ROLE_REMOTE_UPGRADER", energyLevel);
                if (spawn.spawning) spawned++;
            }
            else break;
        }
    }
    private spawnMissingDefenders(roomName: string, energyLevel: number) {
        const currentDefenderCount = this.creepCountAllRooms("ROLE_DEFENDER");
        const spawns = global.roomManager.findSpawns(roomName);
        let defendersNeeded: number = 3 - currentDefenderCount;
        let spawned: number = 0;
        for (var i in spawns) {

            if (spawned < defendersNeeded) {
                var spawn = spawns[i] as StructureSpawn;
                if (spawn.spawning) continue;

                this.trySpawnCreep(spawn, "ROLE_DEFENDER", energyLevel);
                if (spawn.spawning) spawned++;
            }
            else break;
        }

    }
    private spawnMissingReservers(roomName: string, energyLevel: number): void {
        const miners = this.creepCount(roomName, "ROLE_MINER");
        const workers = this.creepCount(roomName, "ROLE_WORKER");
        const upgraders = this.creepCount(roomName, "ROLE_UPGRADER");
        const carriers = this.creepCount(roomName, "ROLE_CARRIER");
        const roomMem = Game.rooms[roomName].memory as RoomMemory;
        const settings = roomMem.settingsMap[energyLevel];

        if (miners < settings.minimumMinerCount
            || carriers < settings.maxCarrierCount
            || upgraders < settings.maxUpgraderCount) {
            return;
        }

        var currentPending = CreepTaskQueue.count(roomName, "Reserve", "", "PENDING");

        var currentlySpawning = _.filter(global.roomManager.findSpawns(roomName, false), s => {
            var spawn = s as StructureSpawn;
            return spawn.spawning != null && this.getRole(spawn.spawning.name) == "ROLE_RESERVER";
        }).length;

        var reserversNeeded = currentPending - currentlySpawning;
        if (reserversNeeded < 1) return;
        var availableSpawns = global.roomManager.findSpawns(roomName, true);

        let reserversSpawned: number = 0;
        for (var i in availableSpawns) {
            var spawn = availableSpawns[i] as StructureSpawn;
            if (reserversSpawned < reserversNeeded) {
                if (this.trySpawnCreep(spawn, "ROLE_RESERVER", energyLevel)) reserversSpawned++;
            }
            else break;
        }

    }
    private spawnMissingDismantlers(roomName: string, energyLevel: number) {
        const miners = this.creepCount(roomName, "ROLE_MINER");
        const carriers = this.creepCount(roomName, "ROLE_CARRIER");
        const upgraders = this.creepCount(roomName, "ROLE_UPGRADER");
        const room = Game.rooms[roomName]
        const roomMem = room.memory as RoomMemory;
        const settings = roomMem.settingsMap[energyLevel];
        const currentCount = this.creepCount(roomName, "ROLE_WORKER");
        if (miners < settings.minimumMinerCount - 1 && currentCount > 0) {
            return;
        }
        if (carriers < settings.minimumCarrierCount || upgraders < settings.maxUpgraderCount) return;

        var flags = _.filter(Game.flags, f => f.pos.roomName == roomName && f.color == COLOR_YELLOW && f.secondaryColor == COLOR_YELLOW);
        if (flags.length == 0) return;
        this.spawnCreeps(roomName, "ROLE_DISMANTLER", 1, energyLevel);

    }
    private spawnMissingWorkers(roomName: string, energyLevel: number) {
        const miners = this.creepCount(roomName, "ROLE_MINER");
        const carriers = this.creepCount(roomName, "ROLE_CARRIER");
        const upgraders = this.creepCount(roomName, "ROLE_UPGRADER");
        const room = Game.rooms[roomName]
        const roomMem = room.memory as RoomMemory;
        const settings = roomMem.settingsMap[energyLevel];
        const currentCount = this.creepCount(roomName, "ROLE_WORKER");
        if (miners < settings.minimumMinerCount - 1 && currentCount > 0) {
            return;
        }
        if (carriers < settings.minimumCarrierCount || upgraders < settings.maxUpgraderCount) return;

        if (room.find(FIND_CONSTRUCTION_SITES).length == 0) return;
        this.spawnCreeps(roomName, "ROLE_WORKER", settings.maxWorkerCount, energyLevel);

    }
    private spawnMissingCarriers(roomName: string, energyLevel: number) {
        const miners = this.creepCount(roomName, "ROLE_MINER");
        const workers = this.creepCount(roomName, "ROLE_WORKER");

        const room = Game.rooms[roomName];
        const roomMem = room.memory as RoomMemory;
        const settings = roomMem.settingsMap[energyLevel];
        const currentCarrierCount = this.creepCount(roomName, "ROLE_CARRIER");
        if (miners < settings.minimumMinerCount - 1 && workers < settings.minimumWorkerCount && currentCarrierCount > 0) {
            return;
        }
        this.spawnCreeps(roomName, "ROLE_CARRIER", settings.maxCarrierCount, energyLevel);
    }
    private spawnMissingUpgraders(roomName: string, energyLevel: number) {
        const roomMem = Game.rooms[roomName].memory as RoomMemory;
        const settings = roomMem.settingsMap[energyLevel];
        const workers = this.creepCount(roomName, "ROLE_WORKER");
        const carriers = this.creepCount(roomName, "ROLE_CARRIER");
        const miners = this.creepCount(roomName, "ROLE_MINER");
        if (miners < settings.minimumMinerCount) return;
        if (carriers < settings.minimumCarrierCount) return;
        this.spawnCreeps(roomName, "ROLE_UPGRADER", settings.maxUpgraderCount, energyLevel);
    }
    private spawnMissingMiners(roomName: string, energyLevel: number) {
        const roomMem = Game.rooms[roomName].memory as RoomMemory;
        const settings = roomMem.settingsMap[energyLevel];
        const spawns = global.roomManager.findSpawns(roomName);
        const currentMinerCount = this.creepCount(roomName, "ROLE_MINER");

        const room = Game.rooms[roomName]
        const sources = room.find(FIND_SOURCES);


        const minerCount = sources.length * settings.minersPerSource;
        this.spawnCreeps(roomName, "ROLE_MINER", minerCount, energyLevel);

    }

    private getCreepParts(role: CreepRole, roomEnergyLevel: number): BodyPartConstant[] {

        switch (role) {
            case "ROLE_MINER": return this.getMinerBodyParts(roomEnergyLevel);
            case "ROLE_UPGRADER": return this.getUpgraderBodyParts(roomEnergyLevel);
            case "ROLE_WORKER": return this.getWorkerBodyParts(roomEnergyLevel);
            case "ROLE_RESERVER": return this.getReserverBodyParts(roomEnergyLevel);
            case "ROLE_CARRIER": return this.getCarrierBodyParts(roomEnergyLevel);
            case "ROLE_DEFENDER": return this.getDefenderBodyParts(roomEnergyLevel);
            case "ROLE_REMOTE_UPGRADER": return this.getRemoteUpgraderBodyParts(roomEnergyLevel);
            case "ROLE_DISMANTLER": return this.getDismantlerBodyParts(roomEnergyLevel);
            default: throw new Error(`${role} is not a valid creep role.`);
        }
    }

    //END OF BAD CODE _ SHOULD REFACTOR

    private spawnCreeps(roomName: string, role: CreepRole, max: number, energyLevel: number) {

        const currentlySpawning = global.roomManager.findSpawns(roomName, true);
        const currentCount = this.creepCount(roomName, role);
        const availableSpawns = global.roomManager.findSpawns(roomName, false);

        var spawningCount = 0;
        for (var i in currentlySpawning) {
            var spawn = currentlySpawning[i] as StructureSpawn;
            if (spawn.spawning != null && spawn.spawning != undefined) {
                if (this.getRole(spawn.spawning.name) == role) spawningCount++;
            }
        }

        let totalNeeded: number = max - (currentCount + spawningCount);
        if (totalNeeded < 1) return;

        let creepsSpawned: number = 0;

        for (var i in availableSpawns) {
            var spawn = availableSpawns[i] as StructureSpawn;
            if (creepsSpawned < totalNeeded) {
                if (this.trySpawnCreep(spawn, role, energyLevel)) creepsSpawned++;
            }
            else break;
        }
    }
    private spawnCreep(spawn: StructureSpawn, bodyParts: BodyPartConstant[], role: CreepRole): number {
        //console.log("trying to spawn " + getRoleString(role))
        let uuid: number = Memory.uuid;
        let creepName: string = spawn.room.name + "-" + role + "-" + (uuid + 1);

        let status: number | string = spawn.spawnCreep(bodyParts, creepName, { dryRun: true });
        status = _.isString(status) ? OK : status;

        while (status == -3) {
            uuid++;
            creepName = spawn.room.name + "-" + role + "-" + (uuid + 1);
            status = spawn.spawnCreep(bodyParts, creepName, { dryRun: true });
            status = _.isString(status) ? OK : status;
        }

        if (status === OK && spawn.spawning == null) {
            Memory.uuid = uuid + 1;
            const memory: CreepMemory =
            {
                id: undefined,
                name: creepName,
                homeRoom: spawn.room.name,
                idle: true,
                currentTask: "",
                alive: true,
                role: role,
                _trav: {},

            };
            status = spawn.spawnCreep(bodyParts, creepName, { memory: memory });
            this.setCreepMemory(spawn.pos.roomName, creepName);
            return _.isString(status) ? OK : status;
        }
        else {

            return status;
        }
    }

    private setCreepMemory(roomName: string, creepName: string) {
        if (this._creeps[roomName] == undefined) {
            this.loadCreeps2(roomName);
        }
        if (!_.contains(this._creeps[roomName], creepName)) {
            this._creeps[roomName].push(creepName);
        }
        //this._creeps2[roomName][creepName] = memory;
        Memory.creeps[creepName] = <CreepMemory>Game.creeps[creepName].memory;
    }

    private trySpawnCreep(spawn: StructureSpawn, role: CreepRole, energyLevel: number) {

        //console.log("trying to spawn a " + role + " for " + spawn.room.name)
        return this.spawnCreep(spawn, this.getCreepParts(role, energyLevel), role) == OK

    }

    public creepCountAllRooms(role?: CreepRole): number {
        let count = 0;
        for (var roomName in Game.rooms) {
            if (this._creeps[roomName] == undefined) this.loadCreeps2(roomName);
            count += role == undefined
                ? this._creeps[roomName].length
                : this.creepNamesByRole(roomName, role).length;
        }
        return count;
    }
    public creepCount(roomName: string, role?: CreepRole): number {
        return (role == undefined)
            ? Object.keys(this._creeps[roomName]).length
            : this.creepNamesByRole(roomName, role).length;
    }
    public creepNamesByRole(roomName: string, role: CreepRole): string[] {
        const creepNames = this._creeps[roomName];
        return _.filter(creepNames, name => {
            var creep = <Creep>Game.creeps[name];
            return creep.memory.role == role
        })
    }
    public idleCreepNames(roomName: string, role?: CreepRole): string[] {
        const creepNames = this.creeps(roomName);
        //console.log(Object.keys(creepDict).length)
        var matching = _.filter(creepNames, name => {
            var creep = Game.creeps[name] as Creep;

            if (role != undefined && creep.memory.role != role) return false;
            if (!creep.memory.idle) return false;
            return true;
            //return creepMemory.idle == true && (role == undefined || creepMemory.role == role)
        })
        return matching;
    }


    private getHomeRoom(creepName: string): string {

        return creepName.split("-")[0];
    }
    private getRole(creepName: string): CreepRole {

        return <CreepRole>creepName.split("-")[1];
    }

    constructor() { }
}



