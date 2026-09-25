import app from "./worker/app";
import { handleGameEventBatch } from "./queues/consumer";
import type { Env, GameQueueMessage } from "./env";

export { StrikeGameDO } from "./durable-objects/StrikeGame";

export default {
  fetch: app.fetch,
  queue: async (batch: MessageBatch<GameQueueMessage>, env: Env) => {
    await handleGameEventBatch(batch, env);
  },
};
