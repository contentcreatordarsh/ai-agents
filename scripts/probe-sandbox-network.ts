#!/usr/bin/env npx tsx
import "dotenv/config";
import { Daytona } from "@daytona/sdk";

const id = process.argv[2] ?? "0b45a70e-1975-4deb-89fc-0d638c0617a0";
const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY! });
const sandbox = await daytona.get(id);
const r = await sandbox.process.executeCommand(
  "curl -s -o /dev/null -w '%{http_code}' https://app.daytona.io/api/health || echo fail",
  undefined,
  undefined,
  20,
);
console.log("health check:", r.result);
