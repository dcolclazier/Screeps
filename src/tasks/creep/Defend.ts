import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "../CreepTaskQueue";
import * as utils from "utils/utils"


export class KeeperLairDefendRequest extends CreepTaskRequest {
  priority: number = 3;
  validRoles: CreepRole[] = ["ROLE_KEEPERLAIRDEFENDER"];
  keeperLairs: string[] = [];
  currentLairTarget!: string;
  name: string = KeeperLairDefend.taskName;
  replacementQueued: boolean = false;
  constructor(originatingRoomName: string, keeperLairRoomName: string) {
    super(originatingRoomName, keeperLairRoomName, keeperLairRoomName, 'todo');

  }

}
export class KeeperLairDefend extends CreepTask {
  public static taskName: string = "KeeperLairDefend"

  protected init() {
    super.init();
    if (this.request.status != "INIT") return;
    if (this.creep.room.name == this.request.targetRoomName) {
      const request = this.request as KeeperLairDefendRequest;
      if ((this.creep.pos.x >= 1 && this.creep.pos.x <= 48) && (this.creep.pos.y >= 1 && this.creep.pos.y <= 48))
      {
        request.keeperLairs = this.creep.room.find(FIND_HOSTILE_STRUCTURES).filter(s => s.structureType == "keeperLair").map(m=>m.id);
        this.request.status = "PREPARE";
      }
      else this.creep.travelTo(new RoomPosition(25, 25, this.request.targetRoomName));
    } else this.creep.travelTo(new RoomPosition(25, 25, this.request.targetRoomName));
  }

  private getNewTarget() {
    const request = this.request as KeeperLairDefendRequest;
    const lairs = request.keeperLairs.map(id => <StructureKeeperLair>Game.getObjectById(id));
    var lairsWithEnemies = lairs.filter(l => l.ticksToSpawn == undefined)
    if (lairsWithEnemies.length > 0) {
      const sortedByRange = _.sortBy(lairsWithEnemies, l => l.pos.getRangeTo(this.creep))
      request.currentLairTarget = _.first(sortedByRange).id;
    }
    else {
      const sortedByTTL = _.sortBy(lairs, l => l.ticksToSpawn == undefined ? 0 : l.ticksToSpawn);
      request.currentLairTarget = _.first(sortedByTTL).id;
    }
  }
  protected prepare() {

    super.prepare();
    if (this.request.status != "PREPARE") return;
    this.getNewTarget();
    const request = this.request as KeeperLairDefendRequest;

    if (request.currentLairTarget == undefined) throw new Error("Undefined target in prepare, should never happen")
    this.request.status = "WORK";
  }
  protected work() {
    super.work();
    if (this.request.status != "WORK") return;
    const request = this.request as KeeperLairDefendRequest;

    const lair = <StructureKeeperLair>Game.getObjectById(request.currentLairTarget);
    if (lair == undefined) throw new Error("lair cannot be undefined");

    if (this.creep.ticksToLive != undefined && this.creep.ticksToLive < 250) {
      if (!request.replacementQueued) {
        request.replacementQueued = true;
        CreepTaskQueue.addPendingRequest(new KeeperLairDefendRequest(request.originatingRoomName, request.targetRoomName));
      }
    }
    if (this.creep.hits < this.creep.hitsMax) {
      this.creep.heal(this.creep);
    }
   
    this.creep.travelTo(lair);
    
    var hostiles = this.creep.pos.findInRange(FIND_HOSTILE_CREEPS, 3)
    if (hostiles.length > 0) {
      var target = _.first(hostiles)
      this.creep.travelTo(target, { movingTarget: true })
      this.creep.attack(target);
      if (target.hits <= 0 || target == undefined) {
        this.request.status = "PREPARE";
      }
    }
    if (lair.ticksToSpawn != undefined && hostiles.length == 0) {
      this.getNewTarget();
    }

  }

  static addRequests(roomName: string): void {

    var roomMem = Memory.rooms[roomName] as KeeperLairRoomMemory;
    if (roomMem == undefined || roomMem.baseRoomName == undefined) return;
    if (roomMem.roomType != "SOURCE_KEEPER") return;

    var currentRequests = CreepTaskQueue.getTasks(roomMem.baseRoomName, roomName, KeeperLairDefend.taskName);
    //console.log(`current request length before: ${currentRequests.length}`)
    //console.log(JSON.stringify(currentRequests,null,2))
    if (currentRequests.length > 0) return;
    var homeRoomName: string = roomMem.baseRoomName;
    var flag = <Flag>utils.getFlag(roomName, "KLD");

    if (flag == undefined) return;

    CreepTaskQueue.addPendingRequest(new KeeperLairDefendRequest(roomMem.baseRoomName, roomName));
    //console.log(`current request length after: ${currentRequests.length}`)
  }
}



export class DefendRequest extends CreepTaskRequest {

  validRoles: CreepRole[] = ["ROLE_DEFENDER"]
  priority: number = 0;
  name = "Defend";
  maxConcurrent: number;
  constructor(roomName: string, targetRoomName: string, maxPerRoom: number) {
    super(roomName, targetRoomName, targetRoomName, `🎇`);
    this.maxConcurrent = maxPerRoom
  }
}

export class Defend extends CreepTask {
  public static taskName: string = "Defend";

  protected init(): void {
    super.init();
    this.request.status = "PREPARE";

  }

  protected prepare(): void {
    super.prepare();
    if (this.request.status != "PREPARE") return;
    if (this.creep.hits < this.creep.hitsMax) {
      this.creep.heal(this.creep);
    }
    if (this.creep.room.name == this.request.targetRoomName) {
      if ((this.creep.pos.x >= 1 && this.creep.pos.x <= 48) && (this.creep.pos.y >= 1 && this.creep.pos.y <= 48))
        this.request.status = "WORK";
      else this.creep.moveTo(new RoomPosition(25, 25, this.request.targetRoomName));
    }
    else this.creep.moveTo(new RoomPosition(25, 25, this.request.targetRoomName));

  }
  protected work(): void {
    super.work();
    if (this.request.status != "WORK") return;

    const room = Game.rooms[this.request.targetRoomName];
    const enemies = room.find(FIND_HOSTILE_CREEPS).sort(e => e.hits);

    if (this.creep.hits < this.creep.hitsMax) {
      this.creep.heal(this.creep);
    }
    if (enemies.length == 0) {
      this.creep.moveTo(25, 25);
      return;
    }
    let healers = _.filter(enemies, e => _.find(e.body, HEAL) != undefined);
    let target = _.first(healers.length > 0 ? healers : enemies);
    var inRange = this.creep.pos.findInRange(FIND_HOSTILE_CREEPS, 4);
    if (_.any(inRange)) {
      healers = _.filter(inRange, e => _.find(e.body, HEAL) != undefined)
      target = _.first(healers.length > 0 ? healers : inRange);
    }

    var range = 1;
    if (_.find(target.body, part => part.type == "ranged_attack") == undefined) {
      range = 2
    }
    if (this.creep.pos.getRangeTo(target) < range) {
      this.creep.move
    }
    if (this.creep.attack(target) == ERR_NOT_IN_RANGE) {
      this.creep.travelTo(target, { movingTarget: true, range: range });
    }
    if (this.creep.rangedAttack(target) == ERR_NOT_IN_RANGE) {
      this.creep.travelTo(target, { movingTarget: true, range: range });
    }
    if (this.creep.hits < this.creep.hitsMax) {
      this.creep.heal(this.creep);
    }

  }
  constructor(taskInfo: CreepTaskRequest) {
    super(taskInfo);
  }
  static addRequests(roomName: string): void {
    var roomMem = Memory.rooms[roomName] as RemoteHarvestRoomMemory;
    if (roomMem == undefined || roomMem.baseRoomName == undefined) return;
    if (roomMem.roomType != "REMOTE_HARVEST") return;
    const currentTasks = CreepTaskQueue.getTasks(roomMem.baseRoomName, roomName, this.taskName);
    if (currentTasks.length > 0) return;

    var defenders = global.creepManager.creeps(roomMem.baseRoomName, "ROLE_DEFENDER", true);


    if (Game.creeps[roomMem.assignedDefender] == undefined) {
      roomMem.assignedReserver = "";
    }
    if (roomMem.assignedReserver == "" && currentTasks.length == 0) {
      CreepTaskQueue.addPendingRequest(new DefendRequest(roomMem.baseRoomName, roomName, 1))
    }
  }
}
