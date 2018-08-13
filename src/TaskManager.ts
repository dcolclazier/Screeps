import * as utils from "utils/utils";
import { CreepTaskQueue } from "tasks/CreepTaskQueue";
import { StructureTaskQueue } from "tasks/StructureTaskQueue";
import { StructureTask } from "tasks/StructureTask";
import { CreepTaskRequest } from "tasks/CreepTaskRequest";
import { Task } from "tasks/Task";
import { Build } from "tasks/creep/Build";
import { Mine } from "tasks/creep/Mine";
import { PickupEnergy } from "tasks/creep/PickupEnergy";
import { Dismantle } from "tasks/creep/Dismantle";
import { FillTower } from "tasks/creep/FillTower";
import { FillStorage } from "tasks/creep/FillStorage";
import { FillContainers } from "tasks/creep/FillContainers";
import { Upgrade } from "tasks/creep/Upgrade";
import { Scout } from "tasks/creep/Scout";
import { Restock } from "tasks/creep/Restock";
import { TowerAttack } from "tasks/structure/TowerAttack";
import { TowerRepair } from "tasks/structure/TowerRepair";


export const TaskStore: any = { Build, Mine, PickupEnergy, Dismantle, FillTower, FillStorage, FillContainers, Scout, Upgrade, Restock, TowerRepair, TowerAttack}
export class TaskManager {

  private addTaskRequests(roomName: string) {

    //console.log("adding tasks")
    Build.addRequests(roomName);
    Restock.addRequests(roomName);
    Mine.addRequests(roomName);
    Upgrade.addRequests(roomName);
    FillContainers.addRequests(roomName);
    FillStorage.addRequests(roomName);
    FillTower.addRequests(roomName);
    TowerAttack.addRequests(roomName);
    TowerRepair.addRequests(roomName);
    //Scout.addRequests(roomName);

  }
 
  private assignTasks(roomName: string) {

    const idleCreeps = utils.findIdleCreeps(roomName);
    _.forEach(idleCreeps, creep => CreepTaskQueue.assignRequest(creep.name, roomName))

    const idleStructures = utils.findIdleStructures(roomName);
    _.forEach(idleStructures, structure => StructureTaskQueue.assignRequest(structure, roomName));
  }
  private continueTasks(roomName: string) {

    var room = Game.rooms[roomName];
    if (room == undefined || room.controller == undefined || !room.controller.my) return;

    _.forEach(CreepTaskQueue.activeTasks(roomName), request => this.runTask(request));
    _.forEach(StructureTaskQueue.activeTasks(roomName), request => this.runTask(request));
  }
  private runTask(request: ITaskRequest) {

    if (TaskStore[request.name] === undefined || TaskStore[request.name] === null) {
      throw new Error(`Task \'${request.name}\' is not registered!!`)
    }
    var task = <ITask2>new TaskStore[request.name](request);

    var req = task.request;
    if (req.assignedToID == undefined || req.assignedToID == "") {
      //console.log("CANNOT RUN A TASK WITHOUT A FULL REQUEST.")
      return;
    }
    
    var id = req.id;
    task.run();
    if (req.status == "FINISHED") {
      switch (req.category) {
        case "CREEP": CreepTaskQueue.removeTask(id); break;
        case "STRUCTURE": StructureTaskQueue.removeTask(id); break;
      }
    }
  }

  public run(roomName: string) {

    this.addTaskRequests(roomName);
    this.assignTasks(roomName);
    this.continueTasks(roomName);
  }
}

export const taskManager = new TaskManager()

