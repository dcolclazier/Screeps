import { Task } from "./Task";
import { CreepTaskRequest } from "./CreepTaskRequest";
//import { SmartContainer, SmartSource,  SmartLink } from "utils/memory"
import { Traveler } from "Traveler";
import { CreepTaskQueue } from "./CreepTaskQueue";
import { TerminalTransferFinish, TerminalTransferStart } from "TerminalTransfer";


export abstract class CreepTask extends Task {
    public request: CreepTaskRequest;
    protected creep: Creep;
    private creepSayDelay: number = 5;

    constructor(request: CreepTaskRequest) {
        super(request);

        this.request = request;
        this.creep = <Creep>Game.getObjectById(this.request.assignedToID);
    }

    protected init(): void {

        if (this.creep == undefined || this.creep.memory == undefined || this.creep == null) {
            this.request.status == "FINISHED";
            return;
        }
        else {
            if (Game.time % this.creepSayDelay == 0) this.creep.say(`${this.request.wingDing}`);

            //if (Object.keys(this.creep.carry).length > 1) {
            //    const room = Game.rooms[this.request.originatingRoomName];
            //    const storage = room.storage;
            //    if (storage != undefined) {
            //        var result = this.creep.transfer(storage, <ResourceConstant>_.findKey(this.creep.carry));
            //        if (result == ERR_NOT_IN_RANGE) {
            //            this.creep.travelTo(storage);
            //        }
            //    }
            //}
            //else if (this.creep.room.name != this.request.targetRoomName) {
            //    this.creep.travelTo(new RoomPosition(25, 25, this.request.targetRoomName));
            //}
            
        }
    }

    protected prepare(): void {

        if (this.creep == undefined || this.creep.memory == undefined || this.creep == null) {
            this.request.status = "FINISHED";
            return;
        }
        //if (Object.keys(this.creep.carry).length > 1 || this.creep.room.name != this.request.targetRoomName) {
        //    this.request.status = "INIT";
        //    return;
        //}

        if (Game.time % this.creepSayDelay == 0) this.creep.say(`${this.request.wingDing}`);

    }

    protected flee(): void {

    }

    protected work(): void {

        if (this.creep == undefined || this.creep.memory == undefined || this.creep == null) {
            this.request.status = "FINISHED";
            return;
        }

        //if (this.creep.room.name != this.request.targetRoomName) {
        //    this.request.status = "INIT";
        //    return;
        //}
        //if (Object.keys(this.creep.carry).length > 1) {
        //  this.request.status = "INIT";
        //  return;
        //}
        //if (this.creep.room.name != this.request.targetRoomName) {
        //    this.request.status = "IN_PROGRESS";
        //    return;
        //}

        if (Game.time % 5 == 0) this.creep.say(`${this.request.wingDing}`);
    }

    protected windDown(): void {
        if (this.creep == undefined || this.creep.memory == undefined || this.creep == null) {
            this.request.status = "FINISHED";
            return;
        }
        if (Game.time % 5 == 0) this.creep.say(`${this.request.wingDing}`);
    }

    protected finish(): void {
        if (this.creep != undefined && this.creep.memory != undefined) {
            this.creep.memory.idle = true;
            this.creep.memory.currentTask = "";
            //this.creep.say("✔")
        }
    }

    protected collectFromMasterLink(roomName: string): boolean {

        const room = Game.rooms[roomName];
        if (room == undefined) return false;

        const links = global.roomManager.links(roomName);

        let masterLinkID = _.find(links, linkMem => linkMem.linkMode == "MASTER_RECEIVE");
        if (masterLinkID == undefined) return false;

        var link = <StructureLink>Game.getObjectById(masterLinkID.id);
        if (link == undefined || link == null)
        {
            //handle removing?

            return false;
        }
        if (link.energy < link.energyCapacity / 2) return false;

        var result = this.creep.withdraw(link, RESOURCE_ENERGY)
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(link);
        }
        return true;
    }

    protected collectFromDroppedEnergy(roomName: string): boolean {
        const room = Game.rooms[roomName];
        if (room == undefined) return false;

        const resourcePileIDs = room.memory.activeResourcePileIDs
            .map(s => Game.getObjectById(s) as Resource)
            .filter(ss => ss != undefined && ss != null && ss.amount > 100)
        if (resourcePileIDs.length == 0) return false;

        const sortedByRange = _.sortBy(resourcePileIDs, s => s.amount / this.creep.pos.getRangeTo(s.pos)).reverse();
        var closest = _.first(sortedByRange);

        var result = this.creep.pickup(closest)
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(closest);
        }
        return true;

    }

    protected collectFromTerminal(roomName: string): boolean {

        //var tasks1 = CreepTaskQueue.getTasks(roomName, undefined, "TerminalTransferFinish");
        //var tasks2 = CreepTaskQueue.getTasks(undefined, roomName, "TerminalTransferFinish");

        var tasks3 = CreepTaskQueue.getTasks(roomName, undefined, "TerminalTransferStart");
        //var tasks4 = CreepTaskQueue.getTasks(undefined, roomName, "TerminalTransferStart");

        if (tasks3.length != 0) {
            return false;
        }

        const room = Game.rooms[roomName];
        if (room == undefined) return false;

        const terminal = room.terminal;
        if (terminal == undefined) return false;

        if (terminal.store.energy == undefined || terminal.store.energy == 0) return false;

        if (this.creep.withdraw(terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(terminal);
            this.creep.withdraw(terminal, RESOURCE_ENERGY)
        }
        return true;
    }

    protected collectFromContainer(roomName: string): boolean {

        const room = Game.rooms[roomName];
        var containers = global.roomManager.containers(roomName);
        //console.log(JSON.stringify(containers));

        var filtered = _.filter(containers, c =>
            _.includes(<CreepRole[]>c.allowedWithdrawRoles, this.creep.memory.role)
            && (<StructureContainer>Game.getObjectById(c.id)).store.energy > (this.creep.carryCapacity - this.creep.carry.energy) * .25);

        var rangeToTarget = <RangeTarget>Game.getObjectById(this.creep.id);
        if (rangeToTarget == undefined) throw new Error("findContainers:rangeToTarget cannot be undefined");

        var sorted = _.sortBy(filtered, c => c.pos.getRangeTo(rangeToTarget))
        var closest = _.first(sorted);
        if (sorted.length == 0) return false;

        var container = Game.getObjectById(closest.id) as StructureContainer;
        var result = this.creep.withdraw(container, RESOURCE_ENERGY)
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(container);
        }
        return true;
    }

    protected collectFromStorage(roomName: string): boolean {
        const room = Game.rooms[roomName];
        if (room == undefined) return false;

        if (room.storage == undefined || room.storage.store.energy < 10000) return false;

        var result = this.creep.withdraw(room.storage, RESOURCE_ENERGY);
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(room.storage);
        }
        return true;
    }

    protected collectFromTombstone(roomName: string): boolean {

        const room = Game.rooms[roomName];
        if (room == undefined) return false;

        const tombstones = room.find(FIND_TOMBSTONES).filter(t => Object.keys(t.store).length > 1 || t.store.energy > 0) as Tombstone[]
        if (tombstones.length == 0) return false;

        const byRange = _.sortBy(tombstones, t => this.creep.pos.getRangeTo(t));
        const tombstone = _.first(byRange);
        var result = this.creep.withdraw(tombstone, _.findKey(tombstone.store) as ResourceConstant);
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(tombstone);
        }
        return true;

    }

    protected collectFromSource(roomName: string): boolean {

        const room = Game.rooms[roomName];
        if (room == undefined) return false;

        var closestSourceID = global.roomManager.findClosestSource(roomName, this.creep, 0);
        if (closestSourceID == undefined) return false;

        var source = <Source>Game.getObjectById(closestSourceID);

        var result = this.creep.harvest(source)
        if (result == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(source);
        }
        return true;
    }

}
