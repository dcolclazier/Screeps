import { CreepTask } from "tasks/CreepTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { CreepTaskQueue } from "../CreepTaskQueue";



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
      if ((this.creep.pos.x >= 1 && this.creep.pos.x <= 48) && (this.creep.pos.y >= 1 && this.creep.pos.y <= 48))
        this.request.status = "PREPARE";
      else this.creep.moveTo(new RoomPosition(25, 25, this.request.targetRoomName));
    }
  }
  protected prepare() {

    super.prepare();
    if (this.creep.room.name != this.request.targetRoomName) this.request.status = "INIT";
    if (this.request.status != "PREPARE") return;
    const request = this.request as KeeperLairDefendRequest;

    const room = Game.rooms[this.request.targetRoomName];
    const keeperLairs = room.find(FIND_HOSTILE_STRUCTURES).filter(s => s.structureType == "keeperLair") as StructureKeeperLair[];

    if (_.any(keeperLairs, l => l.ticksToSpawn == undefined)) {
      const sortedByRange = _.sortBy(keeperLairs, l => l.pos.getRangeTo(this.creep))
      request.currentLairTarget = _.first(sortedByRange).id;
    }
    else {
      const sortedByTTL = keeperLairs.sort(l => l.ticksToSpawn == undefined ? 0 : l.ticksToSpawn);
      request.currentLairTarget = _.first(sortedByTTL).id;
    }
    if (request.currentLairTarget == undefined) throw new Error("Undefined target in prepare, should never happen")
    this.request.status = "WORK";
  }
  protected work() {
    super.work();
    if (this.request.status != "WORK") return;
    const request = this.request as KeeperLairDefendRequest;

    if (this.creep.ticksToLive != undefined && this.creep.ticksToLive < 100) {
      if (!request.replacementQueued) {
        request.replacementQueued = true;
        CreepTaskQueue.addPendingRequest(new KeeperLairDefendRequest(request.originatingRoomName, request.targetRoomName));
      }
    }

    const room = Game.rooms[this.request.targetRoomName];

    if (this.creep.hits < this.creep.hitsMax) {
      this.creep.heal(this.creep);
    }
    const lair = Game.getObjectById(request.currentLairTarget) as StructureKeeperLair;
    var range = this.creep.pos.getRangeTo(lair.pos);
    if (range > 5) {
      this.creep.travelTo(lair, { range: 5 });
    }
    if (lair.ticksToSpawn != undefined) {
      if (lair.ticksToSpawn < 10 && range > 1) this.creep.travelTo(lair)
    }
    else {
      const enemies = room.find(FIND_HOSTILE_CREEPS).filter(c => c.pos.getRangeTo(this.creep) < 5)
      if (enemies == undefined || enemies.length == 0) {
        this.request.status = "PREPARE";
      }
      else {
        if (this.creep.attack(enemies[0]) == ERR_NOT_IN_RANGE) {
          this.creep.travelTo(enemies[0], { movingTarget: true });
        }
      }
    }

  }
  protected windDown() {
    super.windDown();
    if (this.request.status != "WIND_DOWN") return;

  }
  protected finish() {
    super.finish();
    if (this.request.status != "FINISHED") return;

  }

  static addRequests(roomName: string): void {

    var currentRequests = CreepTaskQueue.getTasks(KeeperLairDefend.taskName, roomName);
    if (currentRequests.length > 0) return;
    var homeRoomName: string = "";
    var flag = _.find(Game.flags, f => {
      var split = f.name.split("_");
      if (split.length < 2) return false;
      if (split[0] != roomName) return false;
      if (split[1] != "KLD") return false;
      homeRoomName == split[0];
      return true;
    });

    if (flag == undefined) return;
    if (homeRoomName == "") return;

    CreepTaskQueue.addPendingRequest(new KeeperLairDefendRequest(homeRoomName, roomName));
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


    //northDefendPositionW6S43_1: RoomPosition = new RoomPosition(33, 4, "W6S43");
    //northDefendPositionW6S43_2: RoomPosition = new RoomPosition(33, 6, "W6S43");
    //northDefendPositionW6S43_3: RoomPosition = new RoomPosition(33, 7, "W6S43");

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
        
        const healers = _.filter(enemies, e => _.find(e.body, HEAL) != undefined);
        const target = _.first(healers.length > 0 ? healers : enemies);

        if (this.creep.attack(target) == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(target);
        }
        if (this.creep.rangedAttack(target) == ERR_NOT_IN_RANGE) {
            this.creep.travelTo(target);
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
