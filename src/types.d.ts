//import { SmartSource, SmartContainer, SmartLink, SmartStructure, RoomSettings } from "utils/memory";
//import { CreepTaskRequest } from "tasks/CreepTaskRequest";
//import { StructureTaskRequest } from "tasks/StructureTaskRequest";

// type shim for nodejs' `require()` syntax
// for stricter node.js typings, remove this and install `@types/node`
declare const require: (module: string) => any;


interface PathfinderReturn {
  path: RoomPosition[];
  ops: number;
  cost: number;
  incomplete: boolean;
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
interface StructureMemory {
  idle: boolean;
  alive: boolean;
  currentTask: string;

}
interface TravelState {
  stuckCount: number;
  lastCoord: Coord;
  destination: RoomPosition;
  cpu: number;
}


declare class SmartLink {
  linkID: string;
  roomName: string;
  linkMode: LinkMode;
  constructor(roomName: string, linkID: string, linkMode: LinkMode);
}
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
interface SmartStructure {
  memory: StructureMemory;
  id: string;
}


interface CreepMemory {
  spawnID: string;
  alive: boolean | undefined;
  currentTask: string;
  idle: boolean;
  role: CreepRole;

  _trav: any; //traveler
  _travel: any; //traveler
}

declare class SmartContainer {
  containerID: string;
  roomName: string;
  shouldFill: boolean;
  allowedWithdrawRoles: CreepRole[];
  constructor(roomName: string, containerID: string, shouldFill: boolean, allowedWithdrawRoles: CreepRole[]);
}
declare class SmartSource {
  sourceID: string;
  roomName: string;
  assignedTo: string[];
  linkID: string;
  constructor(sourceID: string, roomName: string);
}
interface RoomMemory {
  harvestLocations: { [index: string]: SmartSource };
  activeWorkerRequests: { [index: string]: CreepTaskRequest };
  test: StructureContainer[];
  pendingWorkerRequests: CreepTaskRequest[];
  pendingStructureRequests: StructureTaskRequest[];
  activeStructureRequests: { [index: string]: StructureTaskRequest };
  containers: { [index: string]: SmartContainer }
  links: { [index: string]: SmartLink }
  activeResourcePileIDs: string[];
  avoid: any;
  towers: { [id: string]: SmartStructure };
  settingsMap: { [energyLevel: number]: RoomSettings };
  baseEntranceRamparts: RoomPosition[];
  baseEntranceWalls: RoomPosition[];
}
declare abstract class CreepTaskRequest implements ITaskRequest {
  status: TaskStatus;
  wingDing: string;
  isCreepTask: boolean;
  targetID: string;
  abstract name: string;
  roomName: string;
  assignedTo: string;
  abstract priority: number;
  abstract requiredRole: CreepRole[];
  abstract maxConcurrent: number;
  constructor(roomName: string, wingDing: string, targetID: string);
}
declare abstract class StructureTaskRequest implements ITaskRequest {
  status: TaskStatus;
  abstract name: string;
  abstract priority: number;
  targetID: string;
  roomName: string;
  assignedTo: string;
  abstract maxConcurrent: number;
  isCreepTask: boolean;
  constructor(roomName: string, targetID: string);
}
interface Creep {
  travelTo(destination: HasPos | RoomPosition, ops?: TravelToOptions): number;
}
interface ITask {
  request: ITaskRequest;
  run(): void;
}
interface ICreepTaskRequest extends ITaskRequest {
  wingDing: string;
}
interface ITaskRequest {
  name: string;
  priority: number;
  targetID: string;
  roomName: string;
  status: TaskStatus;
  assignedTo: string;
  maxConcurrent: number;
  isCreepTask: boolean;
}
interface Memory {
  uuid: number;
  memVersion: number;
  //gcl: any;
  //map: any;
  initialized: boolean;
  //creeps:
  //{
  //  [name: string]: any;
  //};

  //flags:
  //{
  //  [name: string]: any;
  //};

  //rooms:
  //{
  //  [name: string]: RoomMemory;
  //};

  //spawns:
  //{
  //  [name: string]: any;
  //};
}
//declare enum TaskStatus {
//  PENDING = 0,
//  INIT = 1,
//  PREPARE = 2,
//  PRE_RUN = 3,
//  IN_PROGRESS = 4,
//  POST_RUN = 5,
//  FINISHED = 6,
//}
//declare enum CreepRole {
//  ROLE_UNASSIGNED = 0,
//  ROLE_ALL = 1,
//  ROLE_MINER = 2,
//  ROLE_WORKER = 3,
//  ROLE_UPGRADER = 4,
//  ROLE_SCOUT = 5,
//  ROLE_CARRIER = 6,
//  ROLE_REMOTE_UPGRADER = 7,
//  ROLE_DEFENDER = 8
//}

type CreepRole = "ROLE_UNASSIGNED" | "ROLE_ALL" | "ROLE_MINER" | "ROLE_WORKER" | "ROLE_UPGRADER" | "ROLE_SCOUT" | "ROLE_CARRIER" | "ROLE_REMOTE_UPGRADER" | "ROLE_DEFENDER" | "ROLE_DISMANTLER";
type TaskStatus = "PENDING" | "INIT" | "PREPARE" | "PRE_RUN" | "IN_PROGRESS" | "POST_RUN" | "FINISHED";
type LinkMode = "SEND" | "MASTER_RECEIVE" | "SLAVE_RECEIVE";
type Coord = { x: number, y: number };
type HasPos = { pos: RoomPosition };

interface RoomPosition {
  bfsType: BFSSearchType;
  //visited: boolean;
}
type BaseEdge = "constructedWall" | "rampart";
type BFSSearchType = "walkable" | "rampart" | "blocked";
// add your custom typings here
