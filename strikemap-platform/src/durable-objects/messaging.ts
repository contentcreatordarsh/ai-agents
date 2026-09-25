import type { GameEventType, GameMessage } from "../shared/contracts/events";
import { newId } from "../lib/ids";

export class GameSequencer {
  private seq = 0;
  next(): number {
    this.seq += 1;
    return this.seq;
  }
  get current(): number {
    return this.seq;
  }
}

export function envelope<T>(
  gameId: string,
  type: GameEventType,
  payload: T,
  sequencer: GameSequencer,
): GameMessage<T> {
  return {
    type,
    eventId: newId("evt"),
    serverTime: new Date().toISOString(),
    gameId,
    sequence: sequencer.next(),
    payload,
  };
}
