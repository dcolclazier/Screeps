// type shim for nodejs' `require()` syntax
// for stricter node.js typings, remove this and install `@types/node`
declare const require: (module: string) => any;


interface PathfinderReturn {
  path: RoomPosition[];
  ops: number;
  cost: number;
  incomplete: boolean;
}

interface StructureContainer {
  shouldRefill: boolean;
  allowedWithdrawRoles: CreepRole[];
  roomName: string;
}

interface TravelToReturnData {
  nextPos?: RoomPosition;
  pathfinderReturn?: PathfinderReturn;
  state?: TravelState;
  path?: string;
}

interface TravelToOptions {
  ignoreRoads?: boolean;
  ignoreCreeps?: boolean;
  ignoreStructures?: boolean;
  preferHighway?: boolean;
  highwayBias?: number;
  allowHostile?: boolean;
  allowSK?: boolean;
  range?: number;
  obstacles?: { pos: RoomPosition }[];
  roomCallback?: (roomName: string, matrix: CostMatrix) => CostMatrix | boolean;
  routeCallback?: (roomName: string) => number;
  returnData?: TravelToReturnData;
  restrictDistance?: number;
  useFindRoute?: boolean;
  maxOps?: number;
  movingTarget?: boolean;
  freshMatrix?: boolean;
  offRoad?: boolean;
  stuckValue?: number;
  maxRooms?: number;
  repath?: number;
  route?: { [roomName: string]: boolean };
  ensurePath?: boolean;
}

interface TravelData {
  state: any[];
  path: string;
}

interface TravelState {
  stuckCount: number;
  lastCoord: Coord;
  destination: RoomPosition;
  cpu: number;
}

interface StructureLink {
  roomName: string;
  linkMode: LinkMode;
}
//declare class SmartLink {
//  linkID: string;
//  roomName: string;
//  linkMode: LinkMode;
//  constructor(roomName: string, linkID: string, linkMode: LinkMode);
//}
declare class RoomSettings {
  roomName: string;
  minimumWorkerCount: number;
  //lowLevelMinersPerSource: number = 2;
  //highLevelMinersPerSource: number = 1;
  minersPerSource: number;
  minimumCarrierCount: number;
  maxCarrierCount: number;
  minimumMinerCount: number;
  maxWorkerCount: number;
  maxUpgraderCount: number;
  constructor(roomName: string);
}
//interface SmartStructure {
//  memory: StructureMemory;
//  id: string;
//}


interface CreepMemory {
  spawnID: string;
  alive: boolean | undefined;
  currentTask: string;
  idle: boolean;
  role: CreepRole;
  homeRoom: string;

  _trav: any; //traveler
  _travel: any; //traveler
}

//declare class SmartContainer {
//  containerID: string;
//  roomName: string;
//  shouldFill: boolean;
//  allowedWithdrawRoles: CreepRole[];
//  //constructor(roomName: string, containerID: string, shouldFill: boolean, allowedWithdrawRoles: CreepRole[]);
//}
//interface Source {
//  roomName: string;
//  assignedTo: string[];
//  linkID: string;
//  containerID: string;
//}
//declare class SmartSource {
//  sourceID: string;
//  roomName: string;
//  assignedTo: string[];
//  linkID: string;
//  constructor(sourceID: string, roomName: string);
//}
type RoomType = "OWNED" | "REMOTE_HARVEST" | "HOSTILE" | "UNKNOWN" | "SOURCE_KEEPER" | "EMPTY"
interface RoomMemory {
  //sources: { [index: string]: Source };

  //creepTasks: { [requestID: string]: CreepTaskRequest2 }

  //activeWorkerRequests: { [index: string]: CreepTaskRequest };
  //test: StructureContainer[];
  //pendingWorkerRequests: CreepTaskRequest[];
  //pendingStructureRequests: StructureTaskRequest[];
  //activeStructureRequests: { [index: string]: StructureTaskRequest };
  roomType: RoomType;
  initialized: boolean;
  //containerIDs: string[];
  //sourceIDs: string[];
  //sources: { [sourceID: string]: SourceMemory };
  //containers: { [sourceID: string]: ContainerMemory };
  //towers: { [towerID: string]: TowerMemory };
  //links: { [linkID: string]: LinkMemory };
  structures: { [structureID: string] : StructureMemory}
  //linkIDs: string[];
  //towerIDs: string[];
  activeResourcePileIDs: string[];
  avoid: any;
  settingsMap: { [energyLevel: number]: RoomSettings };
  baseEntranceRamparts: RoomPosition[];
  baseEntranceWalls: RoomPosition[];
  //towers: { [id: string]: SmartStructure };
  //containers: { [id: string]: StructureContainer }
  //links: { [id: string]: StructureLink }

}
interface StructureMemory {

  id: string;
  pos: RoomPosition;
  //idle: boolean;
  //alive: boolean;
  currentTask: string;
  roomName: string;
  //alive: boolean | undefined;
  type: StructureConstant | "source";
  //role: StructureRole;

}
interface SourceMemory extends StructureMemory {

  linkID: string;
  containerID: string;
  assignedTo: string[];
}
interface ContainerMemory extends StructureMemory {
  shouldRefill: boolean | undefined;
  allowedWithdrawRoles: CreepRole[] | undefined;
}
interface LinkMemory extends StructureMemory {

  linkMode: LinkMode
}
interface SpawnMemory extends StructureMemory {
}

type TowerMode = "ATTACK" | "HEAL" | "REPAIR" | "IDLE"
interface TowerMemory extends StructureMemory {
  towerMode: TowerMode
}
//declare abstract class CreepTaskRequest implements ITaskRequest {
//  status: TaskStatus;
//  wingDing: string;
//  isCreepTask: boolean;
//  targetID: string;
//  abstract name: string;
//  requestingRoomName: string;
//  targetRoomName: string;
//  assignedTo: string;
//  abstract priority: number;
//  abstract validRoles: CreepRole[];
//  abstract maxConcurrent: number;
//  constructor(roomName: string, wingDing: string, targetID: string);
//}
//declare abstract class CreepTaskRequest2 implements ICreepTaskRequest {

//  status: TaskStatus;
//  wingDing: string;
//  category: TaskCategory;
//  id: string;
//  targetID: string;
//  targetRoomName: string;
//  originatingRoomName: string;
//  assignedToID: string;
//  assignedToName: string;

//  abstract priority: number;
//  abstract validRoles: CreepRole[];
//  abstract name: string;
//  constructor(originatingRoomName: string, targetRoomName: string, targetID: string, wingDing: string);
//}
declare abstract class CreepTaskRequest implements ITaskRequest {

  id: string;
  status: TaskStatus
  category: TaskCategory;

  originatingRoomName: string;
  targetID: string;
  targetRoomName: string;

  assignedToID: string;
  //assignedToName: string;

  wingDing: string;

  abstract priority: number;
  abstract validRoles: CreepRole[];
  abstract name: string

  constructor(originatingRoomName: string, targetRoomName: string, targetID: string, wingDing: string);

}

declare abstract class StructureTaskRequest implements ITaskRequest {
  id: string; status: TaskStatus;
  category: TaskCategory;
  targetID: string;
  targetRoomName: string;
  originatingRoomName: string;
  assignedToID: string;
  //assignedToName: string;
  abstract priority: number;
  abstract validStructureTypes: StructureConstant[];
  abstract name: string;
  constructor(originatingRoomName: string, targetRoomName: string, targetID: string);
  //status: TaskStatus;
  //abstract name: string;
  //abstract priority: number;
  //targetID: string;
  //requestingRoomName: string;
  //targetRoomName: string;
  //assignedTo: string;
  //abstract maxConcurrent: number;
  //isCreepTask: boolean;
  //constructor(roomName: string, targetID: string);
}
interface Creep {
  travelTo(destination: HasPos | RoomPosition, ops?: TravelToOptions): number;
}
//interface ITask {
//  request: ITaskRequest;
//  run(): void;
//}
interface ITask2 {
  //name: string;
  request: ITaskRequest;
  //addRequests(roomName: string, energyLevel: number): void;
  run(): void;
}
interface ICreepTaskRequest extends ITaskRequest {
  wingDing: string;
}
//interface ITaskRequest {
//  name: string;
//  priority: number;
//  targetID: string;
//  requestingRoomName: string;
//  targetRoomName: string;
//  status: TaskStatus;
//  assignedTo: string;
//  maxConcurrent: number;
//  isCreepTask: boolean;
//}
interface ITaskRequest {
  id: string;

  status: TaskStatus;
  category: TaskCategory;
  targetID: string;
  targetRoomName: string;
  originatingRoomName: string;
  assignedToID: string;
  priority: number;
  //validRoles: IRole[];
  name: string
}

//interface OwnedStructure { memory: StructureMemory }

interface Memory {
  owner: string;
  uuid: number;
  memVersion: number;
  initialized: boolean;
  scoutTargets: string[];
  creepTasks: { [requestID: string]: CreepTaskRequest }
  structureTasks: { [requestID: string] : StructureTaskRequest}
  Tasks: { [requestID: string]: ITaskRequest };
}
type ScoutMode = "CLAIM" | "RESERVE" | "SCOUT"
type IRole = CreepRole | StructureRole;

type CreepRole = "ROLE_UNASSIGNED" | "ROLE_ALL" | "ROLE_MINER" | "ROLE_WORKER" | "ROLE_UPGRADER" | "ROLE_SCOUT" | "ROLE_CARRIER" | "ROLE_REMOTE_UPGRADER" | "ROLE_DEFENDER" | "ROLE_DISMANTLER";
type StructureRole = "ROLE_UNASSIGNED" | "ROLE_TOWER" | "ROLE_LINK" | "ROLE_ALL";
type TaskStatus = "INIT" | "PREPARE" | "PRE_RUN" | "IN_PROGRESS" | "WIND_DOWN" | "PENDING" | "FINISHED" | "ANY"
type LinkMode = "SEND" | "MASTER_RECEIVE" | "SLAVE_RECEIVE";
type Coord = { x: number, y: number };
type HasPos = { pos: RoomPosition };
type HasID = { id: string };
type HasRef = { ref: string };

type TaskCategory = "CREEP" | "STRUCTURE";
type BaseEdge = "constructedWall" | "rampart";
type RangeTarget = AnyStructure | Creep | ConstructionSite | Source
