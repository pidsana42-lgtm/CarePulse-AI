import { spawn } from "node:child_process";
import readline from "node:readline";

const server = process.argv[2];
if (!server) throw new Error("server path required");

const child = spawn(process.execPath, [server], { stdio: ["pipe", "pipe", "inherit"] });
let requestId = 1;
const pending = new Map();

function send(method, params = {}) {
  const id = requestId++;
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

readline.createInterface({ input: child.stdout }).on("line", (line) => {
  const msg = JSON.parse(line);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
  }
});

const init = await send("initialize", {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "codex-local-probe", version: "1.0" },
});
child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} })}\n`);
const tools = await send("tools/list", {});
console.log(JSON.stringify({ init, tools }, null, 2));
child.kill();
