import { CreepTaskQueue } from "tasks/CreepTaskQueue";

export class CreepManager {

    private _creeps: Record<string, string[]> = {};

    public creeps(roomName: string, role?: CreepRole, idle?: boolean): string[] {
        if (this._creeps[roomName] == undefined) {
            this.loadCreeps(roomName);
        }
        if (role == undefined && idle == undefined) return this._creeps[roomName];

        return this._creeps[roomName].filter(name => {
            var creep = Game.creeps[name];
            if (creep == undefined || creep == null) return false;
            if (role != undefined && creep.memory.role != role) return false;
            if (idle != undefined && creep.memory.idle != idle) return false;
            return true;

        })
    }
    public run(roomName: string) {

        this.loadCreeps(roomName);
        const room = Memory.rooms[roomName];
        if (room.roomType == "OWNED") {
            this.spawnMissingCreeps(roomName);
        }
        
    }
    private loadCreeps(roomName: string) {
        if (this._creeps[roomName] == undefined) {
            console.log(`initializing creep dictionary for ${roomName}`);
            this._creeps[roomName] = [];
        }
        const room = Game.rooms[roomName];
        if (room == undefined) {
            this._creeps[roomName] = []
            //console.log(`room ${roomName} was undefined in CreepManager.loadCreeps`)
            return;
        }
        const foundCreeps = room.find(FIND_MY_CREEPS);
        //if (this._creeps[roomName] == undefined) this._creeps[roomName] = [];


        for (let id in foundCreeps) {
            const creep = foundCreeps[id];
            if (creep.memory === undefined || creep.memory.id === undefined) {
                //console.log("it happened...")
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
            if (this._creeps[creep.memory.homeRoom] == undefined) {
                this._creeps[creep.memory.homeRoom] = [];
            }
            if (!_.contains(this._creeps[creep.memory.homeRoom], creep.name)) {
                this._creeps[creep.memory.homeRoom].push(creep.name);
            }
           
        }
    }



    public deleteCreep(creepName: string): void {

        var rooms = Object.keys(Game.rooms);

        _.forEach(rooms, r=>{
            _.forEach(global.roomManager.sources(r), source => {
                if (_.includes(source.assignedTo, creepName)) {
                    source.assignedTo = source.assignedTo.filter(s => s != creepName);
                }
            })
        })
        
        delete Memory.creeps[creepName];
        const roomName = this.getHomeRoom(creepName)
        this._creeps[roomName] = this._creeps[roomName].filter(name => name != creepName);
    }

    public totalCreepCount(role?: CreepRole): number {

        let count = 0;
        for (var roomName in Game.rooms) {
            count += this.creeps(roomName, role).length
        }
        return count;
    }
    
    // START OF BAD CODE _ SHOULD REFACTOR
    private spawnMissingCreeps(roomName: string) {

        if (this._creeps[roomName] == undefined) {
            this.loadCreeps(roomName);
        }

        var energyLevel = global.roomManager.getEnergyLevel(roomName);
        this.spawnMissingDefenders(roomName, energyLevel);
        this.spawnMissingMiners(roomName, energyLevel);
        this.spawnMissingWorkers(roomName, energyLevel);
        this.spawnMissingUpgraders(roomName, energyLevel);
        this.spawnMissingCarriers(roomName, energyLevel);
       
        this.spawnMissingReservers(roomName, energyLevel);
        this.spawnMissingRemoteUpgraders(roomName, energyLevel);
        this.spawnMissingDismantlers(roomName, energyLevel);
        this.spawnMissingRemoteCarriers(roomName, energyLevel);
        
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
            case 3: return [MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK]
            case 4: return [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, HEAL]
            case 5: return [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, HEAL]
            default: return [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, HEAL];
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
        //console.log("got here")
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
            case 4: return [MOVE, CLAIM, MOVE, CLAIM]
            case 5: return [MOVE, CLAIM, MOVE, CLAIM]
            default: return [MOVE, MOVE];
        }
    }

    private getRemoteCarrierBodyParts(energyLevel: number): BodyPartConstant[] {

        switch (energyLevel) {
            case 1: return [MOVE, MOVE, CARRY, CARRY];
            case 2: return [MOVE, MOVE, MOVE, CARRY, CARRY, WORK]
            case 3: return [MOVE, MOVE, CARRY, CARRY, CARRY, WORK]
            case 4: return [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, WORK]
            case 5: return [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, WORK]
            default: return [MOVE, MOVE];
        }
    }


    private spawnMissingRemoteUpgraders(roomName: string, energyLevel: number) {
        const miners = this.creeps(roomName, "ROLE_MINER");
        const workers = this.creeps(roomName, "ROLE_WORKER");
        const carriers = this.creeps(roomName, "ROLE_CARRIER");
        const upgraders = this.creeps(roomName, "ROLE_UPGRADER");
        const roomMem = Game.rooms[roomName].memory as OwnedRoomMemory;
        const settings = roomMem.settingsMap[energyLevel];
        const currentRUCount = this.totalCreepCount("ROLE_REMOTE_UPGRADER");
        if (miners.length < settings.minersPerSource * 2
            || workers.length < settings.maxWorkerCount
            || carriers.length < settings.maxCarrierCount) return;

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


        var totalTaskCount = CreepTaskQueue.getTasks(roomName, undefined, "Defend").length;
        //if (roomName == "W4S43") console.log(`Total mine tasks: ${totalTaskCount}`)
        //var miners = global.creepManager.creeps(roomName, "ROLE_MINER");
        this.spawnCreeps(roomName, "ROLE_DEFENDER", totalTaskCount, energyLevel);
        //const currentDefenderCount = this.totalCreepCount("ROLE_DEFENDER");
        //const spawns = global.roomManager.findSpawns(roomName);
        //let defendersNeeded: number = 1 - currentDefenderCount;
        //let spawned: number = 0;
        //for (var i in spawns) {

        //    if (spawned < defendersNeeded) {
        //        var spawn = spawns[i] as StructureSpawn;
        //        if (spawn.spawning) continue;

        //        this.trySpawnCreep(spawn, "ROLE_DEFENDER", energyLevel);
        //        if (spawn.spawning) spawned++;
        //    }
        //    else break;
        //}

    }
    private spawnMissingReservers(roomName: string, energyLevel: number): void {
        const miners = this.creeps(roomName, "ROLE_MINER");
        const upgraders = this.creeps(roomName, "ROLE_UPGRADER");
        const carriers = this.creeps(roomName, "ROLE_CARRIER");
        const roomMem = Game.rooms[roomName].memory as OwnedRoomMemory;
        const settings = roomMem.settingsMap[energyLevel];

        if (miners.length < settings.minimumMinerCount
            || carriers.length < settings.maxCarrierCount
            || upgraders.length < settings.maxUpgraderCount) {
            return;
          
        }
        var currentIdle = this.creeps(roomName, "ROLE_RESERVER", true).length;

        var currentPending = CreepTaskQueue.count(roomName, undefined, "Reserve", undefined, "PENDING");


        //console.log(`current Pending count: ${currentPending}`);
        var currentlySpawning = _.filter(global.roomManager.findSpawns(roomName, true), s => {
            var spawn = s as StructureSpawn;
            return spawn.spawning != null && this.getRole(spawn.spawning.name) == "ROLE_RESERVER";
        }).length;
        //console.log(`current spawning count: ${currentlySpawning}`);

        var reserversNeeded = currentPending - currentlySpawning - currentIdle;
        if (reserversNeeded < 1) return;

        //console.log(`need to spawn ${reserversNeeded} reservers`);
        var availableSpawns = global.roomManager.findSpawns(roomName, false);

        let reserversSpawned: number = 0;
        for (var i in availableSpawns) {
            var spawn = availableSpawns[i] as StructureSpawn;
            if (reserversSpawned < reserversNeeded) {
                //var result = false;
                var result = this.trySpawnCreep(spawn, "ROLE_RESERVER", energyLevel)
                if (result) reserversSpawned++;
                else {
                    console.log("couldn't spawn! " + energyLevel )
                }
            }
            else break;
        }

    }
    private spawnMissingDismantlers(roomName: string, energyLevel: number) {
        const miners = this.creeps(roomName, "ROLE_MINER");
        const carriers = this.creeps(roomName, "ROLE_CARRIER");
        const upgraders = this.creeps(roomName, "ROLE_UPGRADER");
        const room = Game.rooms[roomName]
        const roomMem = room.memory as OwnedRoomMemory;
        const settings = roomMem.settingsMap[energyLevel];
        const currentCount = this.creeps(roomName, "ROLE_WORKER").length;
        if (miners.length < settings.minimumMinerCount - 1 && currentCount > 0) {
            return;
        }
        if (carriers.length < settings.minimumCarrierCount || upgraders.length < settings.maxUpgraderCount) return;

        var flags = _.filter(Game.flags, f => f.pos.roomName == roomName && f.color == COLOR_YELLOW && f.secondaryColor == COLOR_YELLOW);
        if (flags.length == 0) return;
        this.spawnCreeps(roomName, "ROLE_DISMANTLER", 1, energyLevel);

    }
    private spawnMissingWorkers(roomName: string, energyLevel: number) {
        const miners = this.creeps(roomName, "ROLE_MINER");
        const carriers = this.creeps(roomName, "ROLE_CARRIER");
        const upgraders = this.creeps(roomName, "ROLE_UPGRADER");
        const room = Game.rooms[roomName]
        const roomMem = room.memory as OwnedRoomMemory;
        const settings = roomMem.settingsMap[energyLevel];
        const currentCount = this.creeps(roomName, "ROLE_WORKER").length;
        if (miners.length < settings.minimumMinerCount - 1 && currentCount > 0) {
            return;
        }
        if (carriers.length < settings.minimumCarrierCount || upgraders.length < settings.maxUpgraderCount) return;

        var workerCount = global.creepManager.creeps(roomName, "ROLE_WORKER").length;
        var pendingTaskCount = CreepTaskQueue.getTasks(roomName, undefined, "Build", undefined, "PENDING").length;
        if (pendingTaskCount == 0) return;

        if (workerCount > settings.maxWorkerCount) return;

        //if (room.find(FIND_CONSTRUCTION_SITES).length == 0) return;
        this.spawnCreeps(roomName, "ROLE_WORKER", settings.maxWorkerCount, energyLevel);

    }
    private spawnMissingCarriers(roomName: string, energyLevel: number) {
        const miners = this.creeps(roomName, "ROLE_MINER");

       
        const workers = this.creeps(roomName, "ROLE_WORKER");


        const room = Game.rooms[roomName];
        const roomMem = room.memory as OwnedRoomMemory;
        const settings = roomMem.settingsMap[energyLevel];
        const currentCarrierCount = this.creeps(roomName, "ROLE_CARRIER").length;
        if (miners.length == 0) return;
        if (miners.length < settings.minimumMinerCount && currentCarrierCount > 0) return;
       
        if (currentCarrierCount >= settings.maxCarrierCount) return;

        
        if (miners.length < settings.minimumMinerCount - 1 && workers.length < settings.minimumWorkerCount && currentCarrierCount > 0) {
            return;
        }
        this.spawnCreeps(roomName, "ROLE_CARRIER", settings.maxCarrierCount, energyLevel);
    }

    private spawnMissingRemoteCarriers(roomName: string, energyLevel: number) {
        const miners = this.creeps(roomName, "ROLE_MINER");
        const upgraders = this.creeps(roomName, "ROLE_UPGRADER");
        const carriers = this.creeps(roomName, "ROLE_CARRIER");
        const roomMem = Game.rooms[roomName].memory as OwnedRoomMemory;
        const settings = roomMem.settingsMap[energyLevel];

        if (miners.length < settings.minimumMinerCount
            || carriers.length < settings.maxCarrierCount
            || upgraders.length < settings.maxUpgraderCount) {
            return;
        }
        var totalTaskCount = CreepTaskQueue.getTasks(roomName, undefined, "RemotePickup").length;

        this.spawnCreeps(roomName, "ROLE_REMOTE_CARRIER", totalTaskCount, energyLevel);
    }
    private spawnMissingUpgraders(roomName: string, energyLevel: number) {

        const settings = Game.rooms[roomName].memory.settingsMap[energyLevel];

        const carriers = this.creeps(roomName, "ROLE_CARRIER");
        if (carriers.length < settings.minimumCarrierCount) return;

        const miners = this.creeps(roomName, "ROLE_MINER");
        if (miners.length < settings.minimumMinerCount) return;

        this.spawnCreeps(roomName, "ROLE_UPGRADER", settings.maxUpgraderCount, energyLevel);
    }

    private spawnMissingMiners(roomName: string, energyLevel: number) {

        //var pendingTaskCount = CreepTaskQueue.getTasks(roomName, undefined, "Mine", undefined, "PENDING").length;
        var totalTaskCount = CreepTaskQueue.getTasks(roomName, undefined, "Mine").length;
        //if (roomName == "W4S43") console.log(`Total mine tasks: ${totalTaskCount}`)
        //var miners = global.creepManager.creeps(roomName, "ROLE_MINER");
        this.spawnCreeps(roomName, "ROLE_MINER", totalTaskCount, energyLevel);
        //const minersPerSource = Game.rooms[roomName].memory.settingsMap[energyLevel].minersPerSource;
        //const sourceCount = global.roomManager.sources(roomName).length;

        //this.spawnCreeps(roomName, "ROLE_MINER", sourceCount * minersPerSource, energyLevel);
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
            case "ROLE_REMOTE_CARRIER": return this.getRemoteCarrierBodyParts(roomEnergyLevel);
            default: throw new Error(`${role} is not a valid creep role.`);
        }
    }

    //END OF BAD CODE _ SHOULD REFACTOR

    private spawnCreeps(roomName: string, role: CreepRole, max: number, energyLevel: number) {

        const currentlySpawning = global.roomManager.findSpawns(roomName, true);
        const currentCount = this.creeps(roomName, role).length;
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
                if (role == "ROLE_MINER" && roomName == "W4S43") {
                    //console.log("got here.")
                }
                if (this.trySpawnCreep(spawn, role, energyLevel)) creepsSpawned++;
            }
            else break;
        }
    }

    private spawnCreep(spawn: StructureSpawn, bodyParts: BodyPartConstant[], role: CreepRole): number {
        //console.log("trying to spawn " + role);

        let uuid: number = Memory.uuid;
        let creepName: string = spawn.room.name + "-" + role + "-" + (uuid + 1);

        let status: number | string = spawn.spawnCreep(bodyParts, creepName, { dryRun: true });
        status = _.isString(status) ? OK : status;
        //console.log(global.creepManager.creeps("W4S43", "ROLE_MINER"))
        while (status == -3) {
            uuid++;
            creepName = spawn.room.name + "-" + role + "-" + (uuid + 1);
            status = spawn.spawnCreep(bodyParts, creepName, { dryRun: true });
            status = _.isString(status) ? OK : status;
        }
        //console.log(global.creepManager.creeps("W4S43", "ROLE_MINER"))
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
            //if (status == OK) this.setCreepMemory(spawn.room.name, creepName);
            return _.isString(status) ? OK : status;
        }
        else {

            return status;
        }
    }

    //private setCreepMemory(roomName: string, creepName: string) {

    //    if (this._creeps[roomName] == undefined) {
    //        this.loadCreeps(roomName);
    //    }
    //    if (!_.contains(this._creeps[roomName], creepName)) {
    //        this._creeps[roomName].push(creepName);
    //    }
    //    const creep = Game.creeps[creepName];
    //    if (creep != undefined) {
    //        console.log("setting creep memory for " + creepName)
    //        Memory.creeps[creepName] = creep.memory;
    //    }

    //}

    private trySpawnCreep(spawn: StructureSpawn, role: CreepRole, energyLevel: number) {

        return this.spawnCreep(spawn, this.getCreepParts(role, energyLevel), role) == OK
    }

    private getHomeRoom(creepName: string): string {

        return creepName.split("-")[0];
    }

    private getRole(creepName: string): CreepRole {

        return <CreepRole>creepName.split("-")[1];
    }

    constructor() { }
}



