// Local visual review app. Needs Node 22.18 or later, which runs TypeScript directly.
//
// Usage: node server.ts <workdir> [port]   serve the page until the user presses Finish
//        node server.ts <workdir> --check  print every highlighted line, then exit
//
// <workdir> holds issues.json (input). The server writes comments.json there, and
// writes its URL to <workdir>/url while it runs. The port is the first free one
// from [port] (default 8860) up to 9 more.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { join, resolve } from "node:path";

type Ref = { sha: string; label: string; web?: string };
type Snippet = {
  ref: string;
  file: string;
  start: number;
  end: number;
  hl: number[];
  note?: string;
  lines?: { n: number; text: string }[];
};
type Issue = { id: number; title: string; severity: string; file: string; line: number; snippets: Snippet[] };
type Review = { title: string; url?: string; repo: string; refs: Record<string, Ref>; issues: Issue[] };

const [workdirArg, mode = "8860"] = process.argv.slice(2);
if (!workdirArg) {
  console.error("Usage: node server.ts <workdir> [port | --check]");
  process.exit(2);
}
const WORKDIR = resolve(workdirArg);
const COMMENTS = join(WORKDIR, "comments.json");
const URL_FILE = join(WORKDIR, "url");
const PAGE = join(import.meta.dirname, "index.html");

const readReview = (): Review => JSON.parse(readFileSync(join(WORKDIR, "issues.json"), "utf8"));

// Snippets come from pinned SHAs, so they match the reviewed code even if the branch
// moves or the user edits the working tree during the review.
function loadIssues(): Review {
  const data = readReview();
  for (const issue of data.issues) {
    for (const s of issue.snippets) {
      const where = `issue ${issue.id}, ${s.ref}:${s.file}`;
      const ref = data.refs[s.ref];
      if (!ref) throw new Error(`${where}: "${s.ref}" is not a key of refs`);
      let src: string[];
      try {
        src = execFileSync("git", ["-C", data.repo, "show", `${ref.sha}:${s.file}`], {
          encoding: "utf8",
          stdio: ["ignore", "pipe", "pipe"],
          maxBuffer: 64 * 1024 * 1024,
        })
          .replace(/\n$/, "")
          .split("\n");
      } catch {
        throw new Error(`${where}: file not found at ${ref.sha}`);
      }
      if (s.start < 1 || s.start > s.end || s.end > src.length) {
        throw new Error(`${where}: lines ${s.start}-${s.end} are outside the file (${src.length} lines)`);
      }
      const outside = s.hl.filter((n) => n < s.start || n > s.end);
      if (outside.length) throw new Error(`${where}: hl ${outside.join(", ")} is outside ${s.start}-${s.end}`);
      s.lines = [];
      for (let n = s.start; n <= s.end; n++) s.lines.push({ n, text: src[n - 1] });
    }
  }
  return data;
}

function readComments() {
  if (existsSync(COMMENTS)) return JSON.parse(readFileSync(COMMENTS, "utf8"));
  const { title, url, refs } = readReview();
  return { title, url, refs, items: [] };
}

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
  const issue = readReview().issues.find((i) => i.id === body.id);
  if (!issue) return send(res, 400, { error: "unknown issue" });
  const text = String(body.comment ?? "").trim();
  const updatedAt = now();
  const items = data.items.filter((c: { id: number }) => c.id !== issue.id);
  if (text) {
    const { id, title, severity, file, line } = issue;
    items.push({ id, title, severity, file, line, comment: text, updatedAt });
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

// Fail at startup with a clear message, not later when the page loads.
let review: Review;
try {
  review = loadIssues();
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}

if (mode === "--check") {
  for (const issue of review.issues) {
    for (const s of issue.snippets) {
      for (const l of s.lines ?? []) {
        if (s.hl.includes(l.n)) console.log(`#${issue.id} ${s.ref} ${s.file}:${l.n}  ${l.text.trim().slice(0, 100)}`);
      }
    }
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
    // Read on each request, so a change to issues.json needs only a page reload.
    if (route === "GET /api/issues") return send(res, 200, loadIssues());
    if (route === "GET /api/comments") return send(res, 200, readComments());
    if (route === "GET /api/workdir") return send(res, 200, { workdir: WORKDIR });
    if (route === "POST /api/comments") return saveComment(await readBody(req), res);
    if (route === "POST /api/finish") return finish(await readBody(req), res);
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
  console.log(`Visual review: ${url}  comments: ${COMMENTS}`);
});
server.listen(port, "127.0.0.1");
