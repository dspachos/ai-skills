// Local usability review app. Needs Node 22.18 or later, which runs TypeScript directly.
//
// Usage: node server.ts <workdir> [port]   serve the page until the user finishes the review
//        node server.ts <workdir> --check  validate findings.json, then exit
//
// <workdir> holds findings.json (input) and the screenshot files it names. The
// server writes comments.json there, and writes its URL to <workdir>/url while
// it runs. The port is the first free one from [port] (default 8880) up to 9 more.
import { existsSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { join, resolve } from "node:path";

type Evidence = { image?: string; text?: string; note?: string };
type Issue = {
  id: number;
  heuristic: number;
  severity: string;
  check?: string;
  title: string;
  where?: string;
  summary: string;
  evidence?: Evidence[];
  why?: string;
  impact?: string[];
  fix: string;
};
type Coverage = { heuristic: number; status: string; note?: string };
type Review = {
  title: string;
  url?: string;
  target?: string;
  overview: { what?: string; scope?: string; verdict: string; reasons?: string[] };
  coverage?: Coverage[];
  issues: Issue[];
};

const SEVERITIES = ["blocker", "should fix", "polish"];
const VERDICTS = ["pass", "needs fixes", "needs redesign"];
const STATUSES = ["checked", "limited", "not checked"];
const IMAGES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};
const IMG_NAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

const [workdirArg, mode = "8880"] = process.argv.slice(2);
if (!workdirArg) {
  console.error("Usage: node server.ts <workdir> [port | --check]");
  process.exit(2);
}
const WORKDIR = resolve(workdirArg);
const FINDINGS = join(WORKDIR, "findings.json");
const COMMENTS = join(WORKDIR, "comments.json");
const URL_FILE = join(WORKDIR, "url");
const PAGE = join(import.meta.dirname, "index.html");

// Evidence images live in the work folder, so a finding still points at the
// right screenshot after the user edits their files during the review.
function loadReview(): Review {
  const data: Review = JSON.parse(readFileSync(FINDINGS, "utf8"));
  const fail = (msg: string): never => {
    throw new Error(msg);
  };
  if (typeof data.title !== "string" || !data.title) fail("title is missing");
  if (typeof data.overview !== "object" || !VERDICTS.includes(data.overview?.verdict)) {
    fail(`overview.verdict must be one of: ${VERDICTS.join(", ")}`);
  }
  if (data.coverage) {
    const seen = data.coverage.map((c) => c.heuristic).sort((a, b) => a - b).join(",");
    if (seen !== "1,2,3,4,5,6,7,8,9,10") fail("coverage must list each heuristic 1 to 10 exactly once");
    for (const c of data.coverage) {
      if (!STATUSES.includes(c.status)) fail(`coverage H${c.heuristic}: status must be one of: ${STATUSES.join(", ")}`);
    }
  }
  if (!Array.isArray(data.issues)) fail("issues must be an array");
  const seenIds = new Set<number>();
  for (const issue of data.issues) {
    const where = `issue ${issue.id}`;
    if (typeof issue.id !== "number" || seenIds.has(issue.id)) fail(`${where}: ids must be unique numbers`);
    seenIds.add(issue.id);
    if (issue.heuristic < 1 || issue.heuristic > 10 || !Number.isInteger(issue.heuristic)) {
      fail(`${where}: heuristic must be an integer from 1 to 10`);
    }
    if (!SEVERITIES.includes(issue.severity)) fail(`${where}: severity must be one of: ${SEVERITIES.join(", ")}`);
    for (const key of ["title", "summary", "fix"] as const) {
      if (typeof issue[key] !== "string" || !issue[key]) fail(`${where}: ${key} is missing`);
    }
    for (const e of issue.evidence ?? []) {
      if (e.image !== undefined) {
        if (!IMG_NAME.test(e.image)) fail(`${where}: image "${e.image}" is not a plain file name`);
        if (!existsSync(join(WORKDIR, e.image)) || !statSync(join(WORKDIR, e.image)).isFile()) {
          fail(`${where}: image "${e.image}" is not a file in the work folder`);
        }
        if (!IMAGES[Object.keys(IMAGES).find((ext) => e.image!.toLowerCase().endsWith(ext)) ?? ""]) {
          fail(`${where}: image "${e.image}" must be png, jpg, webp or gif`);
        }
      } else if (typeof e.text !== "string" || !e.text) {
        fail(`${where}: each evidence item needs an image or a text`);
      }
    }
    if (!issue.evidence?.length) fail(`${where}: needs at least one evidence item`);
  }
  return data;
}

function readComments() {
  if (existsSync(COMMENTS)) return JSON.parse(readFileSync(COMMENTS, "utf8"));
  const { title, url, target } = readReviewJson();
  return { title, url, target, items: [] };
}

const readReviewJson = (): Review => JSON.parse(readFileSync(FINDINGS, "utf8"));

// Write then rename, so a crash never leaves half a file for the agent to read.
function writeComments(data: unknown) {
  writeFileSync(`${COMMENTS}.tmp`, JSON.stringify(data, null, 2));
  renameSync(`${COMMENTS}.tmp`, COMMENTS);
}

const now = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");

function send(res: ServerResponse, status: number, body: unknown, done?: () => void) {
  const raw = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(raw, done);
}

async function readBody(req: IncomingMessage) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

// The read, change and write below run with no await between them. Node runs one
// callback at a time, so two saves can never overwrite each other.
function saveComment(body: { id?: number; comment?: string }, res: ServerResponse) {
  const data = readComments();
  if (data.finishedAt) return send(res, 409, { error: "review is finished" });
  const issue = readReviewJson().issues.find((i) => i.id === body.id);
  if (!issue) return send(res, 400, { error: "unknown issue" });
  const text = String(body.comment ?? "").trim();
  const updatedAt = now();
  const items = data.items.filter((c: { id: number }) => c.id !== issue.id);
  if (text) {
    const { id, title, heuristic, severity, where } = issue;
    items.push({ id, title, heuristic, severity, where, comment: text, updatedAt });
  }
  data.items = items.sort((a: { id: number }, b: { id: number }) => a.id - b.id);
  writeComments(data);
  send(res, 200, { ok: true, updatedAt });
}

// One write for both keys, so the agent never sees finishedAt without the prompt.
// The server then exits, and that exit is the signal for the agent to continue.
function finish(body: { prompt?: string }, res: ServerResponse) {
  const data = readComments();
  if (!data.finishedAt) {
    data.finalPrompt = String(body.prompt ?? "").trim();
    data.finishedAt = now();
    writeComments(data);
  }
  send(res, 200, { ok: true, finishedAt: data.finishedAt, finalPrompt: data.finalPrompt ?? "" }, () => {
    console.log(`Review finished. Comments: ${COMMENTS}`);
    rmSync(URL_FILE, { force: true });
    process.exit(0);
  });
}

// Serve an evidence image from the work folder. Only plain file names with an
// image extension reach the disk, so no path can escape the work folder.
function sendImage(name: string, res: ServerResponse) {
  const base = name.toLowerCase();
  const ext = Object.keys(IMAGES).find((e) => base.endsWith(e));
  if (!IMG_NAME.test(name) || !ext) return send(res, 404, { error: "not found" });
  const file = resolve(WORKDIR, name);
  if (!file.startsWith(WORKDIR + "/") && file !== WORKDIR) return send(res, 404, { error: "not found" });
  try {
    res.writeHead(200, { "Content-Type": IMAGES[ext], "Cache-Control": "no-store" });
    res.end(readFileSync(file));
  } catch {
    send(res, 404, { error: "not found" });
  }
}

// Fail at startup with a clear message, not later when the page loads.
let review: Review;
try {
  review = loadReview();
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}

if (mode === "--check") {
  console.log(`${review.issues.length} finding(s):`);
  for (const issue of review.issues) {
    const imgs = (issue.evidence ?? []).map((e) => e.image).filter(Boolean).join(", ");
    console.log(`#${issue.id}  H${issue.heuristic}  ${issue.severity}  ${issue.title}${imgs ? `  [${imgs}]` : ""}`);
    if (issue.check && issue.check !== "verified") console.log(`     check: ${issue.check}`);
  }
  for (const c of review.coverage ?? []) {
    if (c.status !== "checked") console.log(`H${c.heuristic} coverage: ${c.status}${c.note ? ` (${c.note})` : ""}`);
  }
  process.exit(0);
}

// Two servers on one folder would overwrite each other's comments, so refuse to
// start when a live server already serves this folder. A URL file whose server is
// gone, or whose port now serves another folder, is old and gets replaced.
if (existsSync(URL_FILE)) {
  const oldUrl = readFileSync(URL_FILE, "utf8").trim();
  const owner = await fetch(`${oldUrl}api/workdir`, { signal: AbortSignal.timeout(1000) })
    .then((r) => r.json())
    .catch(() => null);
  if (owner?.workdir === WORKDIR) {
    console.error(`A review already runs in this folder: ${oldUrl}`);
    process.exit(1);
  }
}
rmSync(URL_FILE, { force: true });

const FIRST_PORT = Number(mode);
let port = FIRST_PORT;

const server = createServer(async (req, res) => {
  try {
    const route = `${req.method} ${req.url}`;
    if (route === "GET /" || route === "GET /index.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(readFileSync(PAGE));
    }
    // Read on each request, so a change to findings.json needs only a page reload.
    if (route === "GET /api/findings") return send(res, 200, loadReview());
    if (route === "GET /api/comments") return send(res, 200, readComments());
    if (route === "GET /api/workdir") return send(res, 200, { workdir: WORKDIR });
    if (route === "POST /api/comments") return saveComment(await readBody(req), res);
    if (route === "POST /api/finish") return finish(await readBody(req), res);
    if (req.method === "GET" && req.url?.startsWith("/img/")) {
      return sendImage(decodeURIComponent(req.url.slice(5)), res);
    }
    send(res, 404, { error: "not found" });
  } catch (e) {
    send(res, 500, { error: (e as Error).message });
  }
});

// A busy port can be another open review, so move to the next port and never
// stop the process that holds it.
server.on("error", (e: NodeJS.ErrnoException) => {
  if (e.code === "EADDRINUSE" && port < FIRST_PORT + 9) {
    port++;
    return server.listen(port, "127.0.0.1");
  }
  console.error(`Cannot listen on ports ${FIRST_PORT}-${port}: ${e.message}`);
  process.exit(1);
});
server.on("listening", () => {
  const url = `http://127.0.0.1:${port}/`;
  writeFileSync(URL_FILE, `${url}\n`);
  console.log(`Usability review: ${url}  comments: ${COMMENTS}`);
});
server.listen(port, "127.0.0.1");
