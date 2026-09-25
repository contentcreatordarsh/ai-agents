import { describe, expect, it } from "vitest";
import { envelope, GameSequencer } from "../durable-objects/messaging";
import { gameStatusFromDb, teamColorFromDb } from "../shared/contracts/game";

describe("shared contracts", () => {
  it("maps db team colors to contract enums", () => {
    expect(teamColorFromDb("blue")).toBe("BLUE");
    expect(teamColorFromDb("RED")).toBe("RED");
  });

  it("maps db game status", () => {
    expect(gameStatusFromDb("lobby")).toBe("LOBBY");
    expect(gameStatusFromDb("active")).toBe("ACTIVE");
  });

  it("increments websocket sequence monotonically", () => {
    const seq = new GameSequencer();
    const a = envelope("game_1", "GAME_STATE", {}, seq);
    const b = envelope("game_1", "SCORE_UPDATED", { scores: {} }, seq);
    expect(a.sequence).toBe(1);
    expect(b.sequence).toBe(2);
    expect(a.gameId).toBe("game_1");
    expect(a.eventId).toMatch(/^evt_/);
  });
});
