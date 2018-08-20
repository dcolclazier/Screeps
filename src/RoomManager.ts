
export class RoomManager {


    constructor() {
        console.log("Global reset!!")
    }
    private _sources3: Record<string, SourceMemory> = {};

    private _sources2: { [roomName: string]: SourceMemory[] } = {}
    private _links2: { [roomName: string]: LinkMemory[] } = {}
    private _containers2: { [roomName: string]: ContainerMemory[] } = {}
    private _towers2: { [roomName: string]: TowerMemory[] } = {}


    public idleStructureIDs(roomName: string): string[] {

        //just load structures with active logic (links, towers, terminals, etc)
        var list: StructureMemory[] = [];

        var towers = this.towers(roomName);
        for (var i in towers) {
            if (towers[i].currentTask == "") list.push(towers[i]);
        }
        return list.map(s => s.id);
    }
    public sources(roomName: string): SourceMemory[] {
        const room = Memory.rooms[roomName];
        if (room == undefined) {
            console.log("ERROR_getSources2 - undefined room in memory? how? " + roomName);
            return [];
        }
        if (this._sources2[roomName] == undefined) {

            this._sources2[roomName] = this.loadSources2(roomName);
            this.initializeSources(roomName)
        }
        return this._sources2[roomName];
    }
    public containers(roomName: string): ContainerMemory[] {
        const room = Memory.rooms[roomName];
        if (room == undefined) {
            console.log("ERROR_getContainers2 - undefined room in memory? how? " + roomName);
            return [];
        }
        if (this._containers2[roomName] == undefined) {
            this._containers2[roomName] = this.loadContainers2(roomName);
            this.initializeContainers(roomName);

        }

        return this._containers2[roomName];
    }
    public links(roomName: string): LinkMemory[] {
        const room = Memory.rooms[roomName];
        if (room == undefined) {
            console.log("ERROR_getLinks2 - undefined room in memory? how?" + roomName);
            return [];
        }
        var links = this._links2[roomName];
        if (links == undefined) {
            links = this._links2[roomName] = this.loadLinks2(roomName);
        }
        return links;
    }
    public towers(roomName: string): TowerMemory[] {
        const room = Memory.rooms[roomName];
        if (room == undefined) {
            console.log("ERROR_getLinks2 - undefined room in memory? how?" + roomName);
            return [];
        }
        var towers = this._towers2[roomName];
        if (towers == undefined) {
            towers = this._towers2[roomName] = this.loadTowers2(roomName);
        }
        return towers;
    }

    public getEnergyLevel(roomName: string): number {

        //var roomCreeps = _.filter(Game.creeps, c => c.memory.homeRoom = roomName)
        var room = Game.rooms[roomName];
        if (room == undefined) return 0;

        var creeps = room.find(FIND_MY_CREEPS);

        if (creeps.length < 3 && room.energyAvailable < 800) return 1;

        let cap = room.energyCapacityAvailable;

        if (cap < 550) return 1;
        else if (cap <= 950) return 2;
        else if (cap <= 1500) return 3;
        else if (cap <= 3500) return 4;
        else return 5;
    }

    public findClosestSource(roomName: string, targetPos: HasPos, energyAmount: number = 0) {
        var withEnergy2: Source[] = [];
        var sources = this.sources(roomName);
        _.forEach(sources, sourceMem => {
            var source = <Source>Game.getObjectById(sourceMem.id);
            if (source.energy > energyAmount) withEnergy2.push(source);
        })
        return _.min(withEnergy2, source => source.pos.getRangeTo(targetPos)).id;
    }
    public findContainers(roomName: string, creepRole: CreepRole, energyAmount: number, sortByRangeToID?: string): string[] {

        var containers = global.roomManager.containers(roomName);

        var filtered = _.filter(containers, c =>
            _.includes(<CreepRole[]>c.allowedWithdrawRoles, creepRole)
            && (<StructureContainer>Game.getObjectById(c.id)).store.energy > energyAmount);

        if (sortByRangeToID != undefined) {
            var rangeToTarget = <RangeTarget>Game.getObjectById(sortByRangeToID);
            if (rangeToTarget == undefined) throw new Error("findContainers:rangeToTarget cannot be undefined");

            var sorted = _.sortBy(filtered, c => c.pos.getRangeTo(rangeToTarget))
            return _.map(sorted, s => s.id);
        }
        else return _.map(filtered, f => f.id);

    }
    public run(roomName: string): void {
        this.loadResources(roomName);
        this.towers(roomName);
        this.containers(roomName);

    }

    public findRestockables(roomName: string): Array<AnyStructure> {

        let room = Game.rooms[roomName];
        if (room == undefined) return [];
        return room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION
                    || structure.structureType == STRUCTURE_SPAWN)
                    && structure.energy < structure.energyCapacity;
            }
        });
    }
    public findSpawns(roomName: string, spawning: boolean = false): AnyOwnedStructure[] {
        let room = Game.rooms[roomName];
        return room.find(FIND_MY_STRUCTURES, {
            filter: (structure: Structure) => {
                if (structure.structureType == STRUCTURE_SPAWN) {
                    let spawner = structure as StructureSpawn;
                    Memory.spawns[spawner.id] = spawner.memory
                    return spawning ? spawner.spawning !== null : spawner.spawning === null;
                    //return onlyNonSpawning ? spawner.spawning === null : true;
                }
                return false;
            }
        });
    }


    /* Initialization methods - runs after loaded*/
    private initializeContainers(roomName: string) {

        //var test = this.containers(roomName);
        _.forEach(this._containers2[roomName], c => {
            if (c.shouldRefill == undefined || c.allowedWithdrawRoles == undefined) {
                var rangeToSources = _.map(this.sources(roomName), s => c.pos.getRangeTo(s));
                var closestRange = _.min(rangeToSources, s => s);
                if (closestRange <= 2) {
                    //miner depository
                    c.allowedWithdrawRoles = ["ROLE_WORKER", "ROLE_CARRIER"];
                }
                else {
                    //probably container withdraw point
                    c.allowedWithdrawRoles = ["ROLE_UPGRADER"];
                    c.shouldRefill = true;
                }
            }
        })
        //this._containers2[roomName] = test;

        //const sources = this.sources;

    }
    private initializeSources(roomName: string) {

        _.forEach(this._sources2[roomName], source => {
            if (source.linkID == "" && source.containerID == "") {

                if (source.linkID == "") {
                    const closestLinks = _.filter(this.links(roomName), l => source.pos.getRangeTo(l) <= 2);
                    if (closestLinks.length > 0) {
                        source.linkID = closestLinks[0].id;
                    }
                }
                if (source.containerID == "") {
                    var test = this.containers(roomName);
                    const closestContainers = _.filter(test, c => source.pos.getRangeTo(c.pos) <= 2);
                    if (closestContainers.length > 0) {
                        source.containerID = closestContainers[0].id;
                    }
                }
            }
        });
    }

    /* Loading methods - should refactor eventually...*/

    private loadContainers2(roomName: string): ContainerMemory[] {
        const roomMem = Memory.rooms[roomName];
        if (roomMem == undefined) {
            console.log("ERROR_loadSources2 - need to handle undefined room " + roomName);
            return [];
        }
        const room = Game.rooms[roomName];
        if (room == undefined) {
            console.log("WARNING_loadContainers - don't have visibility to room " + roomName);
            return [];
        }
        const containers = room.find(FIND_STRUCTURES).filter(s => s.structureType == "container");
        const containerMems: ContainerMemory[] = [];
        _.forEach(containers, container => {
            const mem = <ContainerMemory>{
                type: container.structureType,
                roomName: roomName,
                currentTask: "",
                pos: container.pos,
                id: container.id,
                shouldRefill: false,
                allowedWithdrawRoles: undefined,
            };
            if (roomMem.structures[container.id] == undefined) roomMem.structures[container.id] = mem;
            containerMems.push(mem);
        });
        return containerMems;
    }
    private loadTowers2(roomName: string): TowerMemory[] {
        const roomMem = Memory.rooms[roomName];
        if (roomMem == undefined) {
            console.log("ERROR_loadTowers - need to handle undefined room " + roomName);
            return [];
        }
        if (roomMem.roomType != "OWNED") return [];

        const room = Game.rooms[roomName];
        if (room == undefined) {
            console.log("WARNING_loadTowers2 - don't have visibility to room " + roomName);
            return [];
        }

        const towers = room.find(FIND_MY_STRUCTURES).filter(s => s.structureType == "tower");
        const sourceMems: TowerMemory[] = [];
        _.forEach(towers, tower => {
            const mem = <TowerMemory>{
                pos: tower.pos,
                towerMode: "IDLE",
                id: tower.id,
                currentTask: "",
                type: tower.structureType,
                roomName: tower.room.name,
            }
            if (roomMem.structures[tower.id] == undefined) roomMem.structures[tower.id] = mem;
            sourceMems.push(mem);
        });
        return sourceMems;
    }
    private loadSources2(roomName: string): SourceMemory[] {
        const roomMem = Memory.rooms[roomName];
        if (roomMem == undefined) {
            console.log("ERROR_loadSources2 - need to handle undefined room " + roomName);
            return [];
        }
        const room = Game.rooms[roomName];
        if (room == undefined) {
            console.log("WARNING_loadSources2 - don't have visibility to room " + roomName);
            return [];
        }

        const sources = room.find(FIND_SOURCES);
        const sourceMems: SourceMemory[] = [];
        _.forEach(sources, source => {
            const mem = <SourceMemory>{
                id: source.id,
                pos: source.pos,
                linkID: "",
                currentTask: "",
                assignedTo: [],
                type: "source",
                roomName: source.room.name,
                containerID: "",
            }
            if (roomMem.structures[source.id] == undefined) roomMem.structures[source.id] = mem;
            sourceMems.push(mem);
        });
        return sourceMems;
    }
    private loadLinks2(roomName: string): LinkMemory[] {
        const roomMem = Memory.rooms[roomName];
        if (roomMem == undefined) {
            console.log("ERROR_loadLinks2 - need to handle undefined room " + roomName);
            return [];
        }
        if (roomMem.roomType != "OWNED") return [];

        const room = Game.rooms[roomName];
        if (room == undefined) {
            console.log("WARNING_loadLinks2 - don't have visibility to room " + roomName);
            return [];
        }

        const links = room.find(FIND_MY_STRUCTURES).filter(s => s.structureType == "link");
        //const sources = this.sources(roomName);
        const linkMems: LinkMemory[] = [];
        _.forEach(links, link => {
            let linkMode: LinkMode = "SEND";
            if (room.storage != undefined) {
                var rangeToStorage = room.storage.pos.getRangeTo(link);
                if (rangeToStorage == 1) linkMode = "MASTER_RECEIVE"
            }
            else if (room.controller != undefined) {
                //bug - should be range to source
                var rangeToController = room.controller.pos.getRangeTo(link);
                if (rangeToController <= 2) linkMode = "SEND";
            }
            else {
                //linkMode = "SLAVE_RECEIVE";
            }

            const mem = <LinkMemory>{
                pos: link.pos,
                linkMode: linkMode,
                id: link.id,
                currentTask: "",
                type: link.structureType,
                roomName: link.room.name,
            }
            if (roomMem.structures[link.id] == undefined) roomMem.structures[link.id] = mem;
            linkMems.push(mem);
        });
        return linkMems;
    }
    private loadResources(roomName: string): void {
        const roomMem = Memory.rooms[roomName];
        const room = Game.rooms[roomName];
        if (room == undefined) roomMem.activeResourcePileIDs = [];
        else {
            const resources = room.find(FIND_DROPPED_RESOURCES) as Resource[];
            const sorted = _.sortBy(resources, r => r.amount);
            roomMem.activeResourcePileIDs = sorted.map(u => u.id);
        }
    }
    /* End Loading methods*/



}

