// type shim for nodejs' `require()` syntax
// for stricter node.js typings, remove this and install `@types/node`
declare const require: (module: string) => any;
declare var global: NodeJS.Global;
declare namespace NodeJS {
  interface Global {
    roomManager: RoomManager;
    help: any;
  }
}

interface PathfinderReturn {
  path: RoomPosition[];
  ops: number;
  cost: number;
  incomplete: boolean;
}

declare class RoomSettings {
  roomName: string;
  minimumWorkerCount: number;
  minersPerSource: number;
  minimumCarrierCount: number;
  maxCarrierCount: number;
  minimumMinerCount: number;
  maxWorkerCount: number;
  maxUpgraderCount: number;
  constructor(roomName: string);
}

type RoomType = "OWNED" | "REMOTE_HARVEST" | "HOSTILE" | "UNKNOWN" | "SOURCE_KEEPER" | "EMPTY"
interface RoomMemory {
  roomType: RoomType;
  initialized: boolean;
  structures: { [structureID: string] : StructureMemory}
  activeResourcePileIDs: string[];
  avoid: any;
  settingsMap: { [energyLevel: number]: RoomSettings };
  baseEntranceRamparts: RoomPosition[];
  baseEntranceWalls: RoomPosition[];
}
interface StructureMemory {

  id: string;
  pos: RoomPosition;
  currentTask: string;
  roomName: string;
  type: StructureConstant | "source";

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

interface ITask2 {
  request: ITaskRequest;
  run(): void;
}
interface ITaskRequest {
  id: string;

  status: TaskStatus;
  category: TaskCategory;
  targetID: string;
  targetRoomName: string;
  originatingRoomName: string;
  assignedToID: string;
  priority: number;
  name: string
}
declare abstract class CreepTaskRequest implements ITaskRequest {

  id: string;
  status: TaskStatus
  category: TaskCategory;
  originatingRoomName: string;
  targetID: string;
  targetRoomName: string;
  assignedToID: string;
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
  abstract priority: number;
  abstract validStructureTypes: StructureConstant[];
  abstract name: string;
  constructor(originatingRoomName: string, targetRoomName: string, targetID: string);
 
}

interface Creep {
  travelTo(destination: HasPos | RoomPosition, ops?: TravelToOptions): number;
}
interface CreepDictionary {
  [creepID: string]: CreepMemory;
}

interface CreepMemory {
  alive: boolean | undefined;
  currentTask: string;
  idle: boolean;
  role: CreepRole;
  homeRoom: string;

  _trav: any; //traveler
  _travel: any; //traveler
}


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

type ReserverMode = "CLAIM" | "RESERVE"
type IRole = CreepRole | StructureRole;

type CreepRole = "ROLE_UNASSIGNED" | "ROLE_ALL" | "ROLE_MINER" | "ROLE_WORKER" | "ROLE_UPGRADER" | "ROLE_RESERVER" | "ROLE_CARRIER" | "ROLE_REMOTE_UPGRADER" | "ROLE_DEFENDER" | "ROLE_DISMANTLER";
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

declare class RoomManager {
  public getSources2(roomName: string): SourceMemory[];
  public getContainers2(roomName: string): ContainerMemory[];
  public getLinks2(roomName: string): LinkMemory[];
  public getEnergyLevel(roomName: string): number;
  public findClosestSource(roomName: string, targetPos: HasPos, energyAmount: number) : string;
  public Run(roomName: string): void;
  public findRestockables(roomName: string): Array<AnyStructure>;
}



