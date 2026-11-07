// 메타모아(https://metamoa.com) 연결 — GitHub Actions에서 돈다. 공간 키와 공간 번호는 저장소 비밀값
// (METAMOA_KEY, METAMOA_SPACE_ID)에만 있다. 둘이 없으면 아무것도 보내지 않는다(승인 · 소유자 확인 전).
//   node metamoa.mjs live                 지금 방에 있는 사람 수(봇 · 시험 제외)를 보낸다 (10분마다)
//   node metamoa.mjs update "<글>"         업데이트 소식 (하루 한 번, 200자 · 3줄까지)
//   node metamoa.mjs event <제목> <시작> <끝> [한 줄 설명]   이벤트 (ISO 8601, +09:00)
//   node metamoa.mjs character            야영지 캐릭터(character.png)를 올리고 결과를 본다
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GAME = "https://game.158-247-217-10.sslip.io/hanjaru";
const MM = "https://metamoa.com";
const KEY = process.env.METAMOA_KEY || "";
const SPACE = process.env.METAMOA_SPACE_ID || "";
const here = path.dirname(fileURLToPath(import.meta.url));

// people in the game's rooms right now: the size of every room the server runs (a room counts only who is connected)
async function online() {
  const auth = "Basic " + Buffer.from("hanjaru-dev:").toString("base64");
  const a = await fetch(GAME + "/v2/account/authenticate/device?create=true", { method: "POST", headers: { Authorization: auth, "Content-Type": "application/json" }, body: JSON.stringify({ id: "metamoa-live-counter-0001" }) });
  if (!a.ok) throw new Error("game login " + a.status);
  const tok = (await a.json()).token;
  const r = await fetch(GAME + "/v2/match?limit=100&authoritative=true", { headers: { Authorization: "Bearer " + tok } });
  if (!r.ok) throw new Error("rooms " + r.status);
  const ms = (await r.json()).matches || [];
  return ms.reduce((n, m) => n + (Number(m.size) || 0), 0);
}

async function mm(method, url, body, type = "application/json") {
  const r = await fetch(MM + url, { method, headers: { Authorization: "Bearer " + KEY, "Content-Type": type }, body });
  const t = await r.text();
  console.log(method, url, r.status, t.slice(0, 300));
  return r;
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "live") {
  const n = await online();
  console.log("online", n);
  if (!KEY || !SPACE) { console.log("METAMOA_KEY / METAMOA_SPACE_ID not set yet: nothing sent"); process.exit(0); }
  await mm("POST", `/api/live/${SPACE}`, JSON.stringify({ count: n }));
} else if (!KEY || !SPACE) {
  console.log("METAMOA_KEY / METAMOA_SPACE_ID not set yet: nothing sent");
} else if (cmd === "update") {
  await mm("POST", `/api/update/${SPACE}`, JSON.stringify({ text: args.join(" ").slice(0, 200) }));
} else if (cmd === "event") {
  const [title, starts_at, ends_at, desc] = args;
  await mm("POST", `/api/space/${SPACE}/events`, JSON.stringify({ title, starts_at, ends_at, ...(desc ? { desc } : {}) }));
} else if (cmd === "character") {
  await mm("PUT", `/api/space/${SPACE}/character`, fs.readFileSync(path.join(here, "character.png")), "image/png");
  await new Promise((ok) => setTimeout(ok, 20000));
  await mm("GET", `/api/space/${SPACE}/character`);
} else {
  console.log("usage: live | update <text> | event <title> <starts_at> <ends_at> [desc] | character");
}
