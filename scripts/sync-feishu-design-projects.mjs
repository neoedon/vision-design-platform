#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_WIKI_URL = "";
const DEFAULT_WIKI_TOKEN = "";
const DEFAULT_TABLE_NAME = "设计项目需求提报";
const DEFAULT_POLL_INTERVAL_MS = 10 * 60 * 1000;
const RECORD_PAGE_SIZE = 200;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outputFile = path.join(repoRoot, "public/data/feishu-base-snapshot.json");

const args = process.argv.slice(2);
const watchMode = args.includes("--watch");
const intervalMs = Math.max(
  60_000,
  Number(readArg("--interval-ms") ?? process.env.FEISHU_DESIGN_PROJECT_SYNC_INTERVAL_MS) ||
    DEFAULT_POLL_INTERVAL_MS,
);

function readArg(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function wikiTokenFromUrl(url) {
  return url.match(/\/wiki\/([^/?#]+)/)?.[1] ?? DEFAULT_WIKI_TOKEN;
}

function readJsonFromCli(cliArgs, label) {
  const stdout = execFileSync("lark-cli", cliArgs, {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
  const start = stdout.indexOf("{");
  const end = stdout.lastIndexOf("}");

  if (start < 0 || end < start) {
    throw new Error(`lark-cli ${label} did not return JSON.`);
  }

  return JSON.parse(stdout.slice(start, end + 1));
}

function valueToText(value) {
  if (value == null || value === "") {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(valueToText).filter(Boolean).join(" / ");
  }

  if (typeof value === "object") {
    if (typeof value.name === "string") {
      return value.name;
    }
    if (typeof value.text === "string") {
      return value.text;
    }
    if (typeof value.url === "string") {
      return value.url;
    }
    if (typeof value.file_token === "string") {
      return typeof value.name === "string" ? value.name : "attachment";
    }
    return JSON.stringify(value);
  }

  return "";
}

function sanitizeFieldValue(value) {
  if (value == null || value === "") {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeFieldValue).filter(Boolean);
  }

  if (typeof value === "object") {
    return valueToText(value);
  }

  return value;
}

function readArrayField(fields, name) {
  const value = fields[name];
  if (Array.isArray(value)) {
    return value.map(valueToText).filter(Boolean);
  }
  const text = valueToText(value);
  return text ? [text] : [];
}

function attachmentCount(value) {
  return Array.isArray(value) ? value.length : value ? 1 : 0;
}

function deriveRecord(fields) {
  const title = valueToText(fields["需求名称 - Requirement Description * 必填项"]);
  const completed = Boolean(fields["是否完成 - Status"]);

  return {
    title: title || "未命名需求",
    completed,
    status: completed ? "已完成" : "未完成",
    priority: valueToText(fields["优先级 - Priority * 必填项"]) || "未设置",
    proposer: valueToText(fields["需求方 - Proposer"]) || "未设置",
    supplier: valueToText(fields["交付 - Supplier"]) || "未设置",
    assignee: valueToText(fields["指定对接设计"]) || "未设置",
    department: valueToText(fields["需求部门"]) || "未设置",
    channel: readArrayField(fields, "渠道 - Channel"),
    product: readArrayField(fields, "哪个产品 - Which Product？(可多选"),
    medium: readArrayField(fields, "媒介 - Media (可多选"),
    visualScale: valueToText(fields["视觉量级"]) || "未设置",
    size: valueToText(fields["数字尺寸 - Size"]) || "",
    createdAt: valueToText(fields["创建时间"]) || "",
    deadline: valueToText(fields["交付时间 - Deadline * 必填项"]) || "",
    document: valueToText(fields["需求文档描述 - Link * 必填项"]) || "",
    background:
      valueToText(fields["项目背景与目标：为什么要这么设计？"]) ||
      valueToText(fields["需求目标及背景 - 必填项*"]),
    audience: valueToText(fields["目标受众与投放渠道：设计给谁看？在哪里看？"]),
    successMetric: valueToText(fields["衡量成功的指标"]),
    notice: valueToText(fields["备注 - Notice"]),
    attachmentCount:
      attachmentCount(fields["需求附件 - Attachment"]) +
      attachmentCount(fields["视觉参考 - Reference"]) +
      attachmentCount(fields["交付文件 - Delivery documents"]),
  };
}

function tally(records, getter) {
  return records.reduce((accumulator, record) => {
    const values = getter(record);
    const list = Array.isArray(values) ? values : [values];
    for (const item of list) {
      const key = item || "未设置";
      accumulator[key] = (accumulator[key] ?? 0) + 1;
    }
    return accumulator;
  }, {});
}

async function syncOnce() {
  const wikiUrl = process.env.FEISHU_DESIGN_PROJECT_WIKI_URL ?? DEFAULT_WIKI_URL;
  const wikiToken =
    process.env.FEISHU_DESIGN_PROJECT_WIKI_TOKEN ?? wikiTokenFromUrl(wikiUrl);
  const publicWikiUrl = process.env.FEISHU_DESIGN_PROJECT_PUBLIC_WIKI_URL ?? "";
  const requestedTableName =
    process.env.FEISHU_DESIGN_PROJECT_TABLE_NAME ?? DEFAULT_TABLE_NAME;

  if (!wikiToken) {
    throw new Error(
      "Set FEISHU_DESIGN_PROJECT_WIKI_URL or FEISHU_DESIGN_PROJECT_WIKI_TOKEN before syncing.",
    );
  }

  const nodeEnvelope = readJsonFromCli(
    ["wiki", "spaces", "get_node", "--params", JSON.stringify({ token: wikiToken })],
    "wiki get_node",
  );
  const node = nodeEnvelope.data?.node;

  if (node?.obj_type !== "bitable" || !node.obj_token) {
    throw new Error(`Wiki token ${wikiToken} is ${node?.obj_type ?? "unknown"}, not bitable.`);
  }

  const baseToken = node.obj_token;
  const tableEnvelope = readJsonFromCli(
    ["base", "+table-list", "--base-token", baseToken, "--offset", "0", "--limit", "100"],
    "table list",
  );
  const tables = tableEnvelope.data?.tables ?? [];
  const selectedTable =
    tables.find((table) => table.name === requestedTableName) ??
    tables.find((table) => table.name?.includes(requestedTableName)) ??
    tables[0];

  if (!selectedTable?.id) {
    throw new Error(`No table found in Base ${baseToken}.`);
  }

  const fieldEnvelope = readJsonFromCli(
    [
      "base",
      "+field-list",
      "--base-token",
      baseToken,
      "--table-id",
      selectedTable.id,
      "--offset",
      "0",
      "--limit",
      "200",
    ],
    "field list",
  );
  const fields = fieldEnvelope.data?.fields ?? [];
  const fieldById = new Map(fields.map((field) => [field.id, field]));
  const records = [];
  const ignoredFields = new Map();

  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const recordEnvelope = readJsonFromCli(
      [
        "base",
        "+record-list",
        "--base-token",
        baseToken,
        "--table-id",
        selectedTable.id,
        "--offset",
        String(offset),
        "--limit",
        String(RECORD_PAGE_SIZE),
        "--format",
        "json",
      ],
      `record list offset ${offset}`,
    );
    const page = recordEnvelope.data ?? {};
    const rows = page.data ?? [];
    const fieldIds = page.field_id_list ?? [];
    const recordIds = page.record_id_list ?? [];

    for (const ignored of page.ignored_fields ?? []) {
      ignoredFields.set(ignored.id ?? ignored.name, ignored);
    }

    rows.forEach((row, rowIndex) => {
      const fieldsByName = {};
      const rawFieldsByName = {};

      fieldIds.forEach((fieldId, fieldIndex) => {
        const field = fieldById.get(fieldId);
        const fieldName = field?.name ?? page.fields?.[fieldIndex] ?? fieldId;
        const value = row[fieldIndex] ?? null;
        rawFieldsByName[fieldName] = value;
        fieldsByName[fieldName] = sanitizeFieldValue(value);
      });

      const recordId = recordIds[rowIndex] ?? `offset-${offset + rowIndex}`;
      records.push({
        id: recordId,
        recordId,
        fields: fieldsByName,
        derived: deriveRecord(rawFieldsByName),
      });
    });

    hasMore = Boolean(page.has_more);
    offset += rows.length || RECORD_PAGE_SIZE;
  }

  const snapshot = {
    schemaVersion: 1,
    generatedBy: "scripts/sync-feishu-design-projects.mjs",
    syncedAt: new Date().toISOString(),
    source: {
      title: node.title ?? "设计项目需求提报系统",
      wikiUrl: publicWikiUrl,
      tableName: selectedTable.name,
      includedTables: [selectedTable.name],
      excludedTables: tables
        .filter((table) => table.id !== selectedTable.id)
        .map((table) => table.name),
      syncMode: "one-way-full-snapshot",
      pollIntervalMs: intervalMs,
    },
    fields: fields.map((field) => ({
      id: field.id,
      name: field.name,
      type: field.type,
      multiple: field.multiple,
      options: field.options,
      style: field.style,
      reason: field.reason,
    })),
    ignoredFields: Array.from(ignoredFields.values()),
    records,
    summary: {
      totalRecords: records.length,
      completedRecords: records.filter((record) => record.derived.completed).length,
      openRecords: records.filter((record) => !record.derived.completed).length,
      byPriority: tally(records, (record) => record.derived.priority),
      byDepartment: tally(records, (record) => record.derived.department),
      byChannel: tally(records, (record) => record.derived.channel),
    },
  };

  mkdirSync(path.dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, `${JSON.stringify(snapshot, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        outputFile,
        table: selectedTable.name,
        totalRecords: records.length,
        openRecords: snapshot.summary.openRecords,
        completedRecords: snapshot.summary.completedRecords,
      },
      null,
      2,
    ),
  );
}

async function run() {
  do {
    try {
      await syncOnce();
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      if (!watchMode) {
        process.exitCode = 1;
        return;
      }
    }

    if (watchMode) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  } while (watchMode);
}

run();
