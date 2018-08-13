import { ErrorMapper } from "utils/ErrorMapper";
import { roomManager } from "roomManager";
import * as MemUtils from "utils/memory"
import * as utils from "utils/utils"
import { taskManager } from "taskManager";
import { CreepManager } from "CreepFactory";



function mainLoop() {
  MemUtils.InitializeGame();
  for (const i in Game.rooms) {
    const room: Room = Game.rooms[i];
    const roomName = room.name;
    roomManager.Run(roomName);
    CreepManager.run(roomName);
    taskManager.run(roomName);
  }

  MemUtils.cleanupCreeps();
}

export const loop = ErrorMapper.wrapLoop(mainLoop);

