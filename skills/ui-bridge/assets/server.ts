// Local form app. Needs Node 22.18 or later, which runs TypeScript directly.
//
// Usage: node server.ts <workdir> [port]   serve the form until the user presses Finish
//        node server.ts <workdir> --check  validate form.json, then exit
//
// <workdir> holds form.json (input). The server writes answers.json there.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { join, resolve } from "node:path";

type Field = {
  id: string;
  type: string;
  label: string;
  options?: unknown;
  default?: unknown;
  required?: boolean;
};
type Section = { title: string; description?: string; fields: Field[] };
type Form = { title: string; description?: string; submitLabel?: string; sections: Section[] };

const [workdirArg, mode = "8870"] = process.argv.slice(2);
if (!workdirArg) {
  console.error("Usage: node server.ts <workdir> [port | --check]");
  process.exit(2);
}
const WORKDIR = resolve(workdirArg);
const FORM = join(WORKDIR, "form.json");
const ANSWERS = join(WORKDIR, "answers.json");
const PAGE = join(import.meta.dirname, "index.html");

const TYPES = ["text", "textarea", "choice", "multichoice", "checkbox", "number"];
const isString = (v: unknown): v is string => typeof v === "string";
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString);

// Fail at startup with a clear list, not later when the page loads.
function validate(form: Form): string[] {
  const errors: string[] = [];
  const add = (msg: string) => errors.push(msg);
  if (!isString(form.title) || !form.title.trim()) add("form: title must be a non-empty string");
  if (!Array.isArray(form.sections) || form.sections.length === 0) add("form: sections must be a non-empty array");
  const seen = new Set<string>();
  (form.sections ?? []).forEach((section, si) => {
    const where = `section ${si + 1}`;
    if (!isString(section.title) || !section.title.trim()) add(`${where}: title must be a non-empty string`);
    if (!Array.isArray(section.fields) || section.fields.length === 0) add(`${where}: fields must be a non-empty array`);
    (section.fields ?? []).forEach((field, fi) => {
      const at = `${where}, field ${fi + 1}`;
      if (!isString(field.id) || !field.id.trim()) add(`${at}: id must be a non-empty string`);
      else if (seen.has(field.id)) add(`${at}: duplicate id "${field.id}"`);
      else seen.add(field.id);
      if (!isString(field.label) || !field.label.trim()) add(`${at}: label must be a non-empty string`);
      if (!TYPES.includes(field.type)) add(`${at}: type must be one of ${TYPES.join(", ")}`);
      if (field.type === "choice" || field.type === "multichoice") {
        if (!isStringArray(field.options) || field.options.length === 0) {
          add(`${at}: ${field.type} needs options, a non-empty array of strings`);
        } else if (field.type === "choice" && isString(field.default) && !field.options.includes(field.default)) {
          add(`${at}: default "${field.default}" is not one of options`);
        } else if (field.type === "multichoice" && isStringArray(field.default)) {
          const bad = field.default.filter((d) => !field.options!.includes(d));
          if (bad.length) add(`${at}: default ${JSON.stringify(bad)} is not in options`);
        }
      }
      if (field.type === "checkbox" && field.default !== undefined && typeof field.default !== "boolean") {
        add(`${at}: checkbox default must be a boolean`);
      }
      if (field.type === "number" && field.default !== undefined && typeof field.default !== "number") {
        add(`${at}: number default must be a number`);
      }
    });
  });
  return errors;
}

function loadForm(): Form {
  const form = JSON.parse(readFileSync(FORM, "utf8"));
  const errors = validate(form);
  if (errors.length) throw new Error(`form.json has ${errors.length} problem(s):\n  - ${errors.join("\n  - ")}`);
  return form;
}

function readAnswers() {
  if (existsSync(ANSWERS)) return JSON.parse(readFileSync(ANSWERS, "utf8"));
  const { title } = readFormMeta();
  return { title, values: {}, finalPrompt: "" };
}

function readFormMeta() {
  // The page asks for the full form on load; this path only needs the title.
  return JSON.parse(readFileSync(FORM, "utf8"));
}

// Write then rename, so a crash never leaves half a file for the agent to read.
function writeAnswers(data: unknown) {
  writeFileSync(`${ANSWERS}.tmp`, JSON.stringify(data, null, 2));
  renameSync(`${ANSWERS}.tmp`, ANSWERS);
}

const now = () => new Date().toISOString().replace(/\.\d+Z$/, "Z");

function send(res: ServerResponse, status: number, body: unknown, done?: () => void) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body), done);
}

async function readBody(req: IncomingMessage) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function saveValues(body: { values?: unknown }, res: ServerResponse) {
  const data = readAnswers();
  if (data.finishedAt) return send(res, 409, { error: "form is finished" });
  data.values = body.values ?? {};
  writeAnswers(data);
  send(res, 200, { ok: true, savedAt: now() });
}

// One write for the finish, so the agent never sees finishedAt without the values.
function finish(body: { values?: unknown; finalPrompt?: string }, res: ServerResponse) {
  const data = readAnswers();
  if (!data.finishedAt) {
    data.values = body.values ?? {};
    data.finalPrompt = String(body.finalPrompt ?? "").trim();
    data.finishedAt = now();
    writeAnswers(data);
  }
  send(res, 200, { ok: true, finishedAt: data.finishedAt }, () => {
    console.log(`Form finished. Answers: ${ANSWERS}`);
    process.exit(0);
  });
}

let form: Form;
try {
  form = loadForm();
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}

if (mode === "--check") {
  const count = form.sections.reduce((n, s) => n + s.fields.length, 0);
  console.log(`form.json ok: ${form.sections.length} sections, ${count} fields`);
  process.exit(0);
}

const PORT = Number(mode);

const server = createServer(async (req, res) => {
  try {
    const route = `${req.method} ${req.url}`;
    if (route === "GET /" || route === "GET /index.html") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(readFileSync(PAGE));
    }
    // Read on each request, so a change to form.json needs only a page reload.
    if (route === "GET /api/form") return send(res, 200, loadForm());
    if (route === "GET /api/answers") return send(res, 200, readAnswers());
    if (route === "POST /api/values") return saveValues(await readBody(req), res);
    if (route === "POST /api/finish") return finish(await readBody(req), res);
    send(res, 404, { error: "not found" });
  } catch (e) {
    send(res, 500, { error: (e as Error).message });
  }
});

server.on("error", (e) => {
  console.error(`Cannot listen on port ${PORT}: ${e.message}`);
  process.exit(1);
});
server.listen(PORT, "127.0.0.1", () => {
  console.log(`ui-bridge form: http://127.0.0.1:${PORT}  answers: ${ANSWERS}`);
});
