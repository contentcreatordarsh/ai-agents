import { Daytona } from "@daytona/sdk";

export function getDaytona(): Daytona {
  const apiKey = process.env.DAYTONA_API_KEY;
  if (!apiKey) {
    throw new Error("DAYTONA_API_KEY is not configured.");
  }
  return new Daytona({
    apiKey,
    ...(process.env.DAYTONA_API_URL
      ? { apiUrl: process.env.DAYTONA_API_URL }
      : {}),
    ...(process.env.DAYTONA_TARGET
      ? { target: process.env.DAYTONA_TARGET }
      : {}),
  });
}
