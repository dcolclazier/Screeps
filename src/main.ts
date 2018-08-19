import { ErrorMapper } from "utils/ErrorMapper";
import * as MemUtils from "utils/memory"
import * as utils from "utils/utils"
import { TaskManager } from "TaskManager";
import { CreepManager } from "CreepManager";
import { RoomManager } from "RoomManager"


global.roomManager = new RoomManager();
global.taskManager = new TaskManager();
global.creepManager = new CreepManager();

global.log = (thing: any) => console.log(JSON.stringify(thing, null, 2));

function mainLoop() {
  MemUtils.InitializeGame();
  for (const roomName in Memory.rooms) {
    global.roomManager.run(roomName);
    global.creepManager.run(roomName);
    global.taskManager.run(roomName);
  }
  MemUtils.cleanupCreeps();
  
}

export const loop = ErrorMapper.wrapLoop(mainLoop);

