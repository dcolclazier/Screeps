import { Task, TaskStatus } from "./Task";
import { CreepTaskRequest } from "./CreepTaskRequest";
import { CreepMemory } from "utils/memory"
import * as utils from "utils/utils";

export abstract class CreepTask extends Task {
  public request: CreepTaskRequest;
  protected creep: Creep;
  creepMemory: CreepMemory;

  constructor(request: CreepTaskRequest) {
    super(request);

    this.request = request as CreepTaskRequest;
    this.creep = Game.creeps[this.request.assignedTo];
    if (this.creep == undefined || this.creep.memory == undefined) {
      console.log("You cant create a task with an undefined creep.")
    }
    this.creepMemory = this.creep.memory as CreepMemory;

  }
  protected init(): void {

    this.creep = Game.creeps[this.request.assignedTo];
    if (this.creep == undefined || this.creep.memory == undefined)
      console.log("You cant create a task with an undefined creep.")
     
  }
  protected prepare(): void
  {
    this.creep = Game.creeps[this.request.assignedTo];
    if (this.creep == undefined || this.creep.memory == undefined) {
      console.log("during prep, creep was undefined - finishing task")
      this.request.status = TaskStatus.FINISHED;
    }
    else {
      this.creepMemory = this.creep.memory as CreepMemory;
    }
    
  }
 
  protected continue(): void {
    this.creep = Game.creeps[this.request.assignedTo];
    if (this.creep == undefined || this.creep.memory == undefined) {
      console.log("during continue, creep was undefined - finishing task")
      this.request.status = TaskStatus.FINISHED;
    }
    else {
      this.creepMemory = this.creep.memory as CreepMemory;
      if (Game.time % 5 == 0) this.creep.say(`${this.request.wingDing}`);
    }
  }

  protected finish(): void {
    // console.log(`CreepTask Finish: ${this.request.name}: ${this.request.assignedTo}`);
    //this.request.assignedTo = "";
    const creep = Game.creeps[this.request.assignedTo];
    if (creep != undefined && creep.memory != undefined) {
      var creepMemory = creep.memory as CreepMemory;
      creepMemory.idle = true;
      creepMemory.currentTask = "";
      creep.say("✔")
      //shouldn't need
      
    }
  }


  //protected collectFromSource(roomName: string) {

  //}
  //protected collectFromContainer(roomName: string) {

  //  if (Game.time % 5 == 0) this.creep.say(`${this.request.wingDing}`);

  //  const closestContainer = utils.findClosestContainer(roomName, this.creep.id, true, false) as StructureContainer;

  //  //no valid container at the moment...
  //  if (closestContainer == undefined) {


  //    //if (Game.time % 5 == 0) this.creep.say(`⌛`);
  //    //continue until empty, then try again.
  //    //if(creep.carry.energy > 0) this.request.status = TaskState.IN_PROGRESS;
  //    //else return;

  //  }

  //  if (creep.withdraw(closestContainer, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
  //    creep.moveTo(closestContainer, { visualizePathStyle: { stroke: '#ffaa00' } });
  //  }

  //}

}
