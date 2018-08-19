import { ErrorMapper } from "utils/ErrorMapper";
import * as MemUtils from "utils/memory"
import * as utils from "utils/utils"
import { TaskManager } from "TaskManager";
import { CreepManager } from "CreepManager";
import { RoomManager } from "RoomManager"


global.roomManager = new RoomManager();
global.taskManager = new TaskManager();

function mainLoop() {
  MemUtils.InitializeGame();
  for (const roomName in Memory.rooms) {
    //const room: Room = Game.rooms[i];
    //const roomName = room.name;
    global.roomManager.run(roomName);
    CreepManager.run(roomName);
    global.taskManager.run(roomName);
  }
  MemUtils.cleanupCreeps();
  global.help = () => console.log("Helps!")
}

export const loop = ErrorMapper.wrapLoop(mainLoop);

