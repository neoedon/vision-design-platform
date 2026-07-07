import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  RefreshCw,
  SearchCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";

type SnapshotField = {
  id: string;
  name: string;
  type?: string;
  multiple?: boolean;
  reason?: string;
};

type DerivedRecord = {
  title: string;
  completed: boolean;
  status: string;
  priority: string;
  proposer: string;
  supplier: string;
  assignee: string;
  department: string;
  channel: string[];
  product: string[];
  medium: string[];
  visualScale: string;
  size: string;
  createdAt: string;
  deadline: string;
  document: string;
  background: string;
  audience: string;
  successMetric: string;
  notice: string;
  attachmentCount: number;
};

type SnapshotRecord = {
  id: string;
  recordId?: string;
  fields: Record<string, unknown>;
  derived?: Partial<DerivedRecord>;
};

type FeishuBaseSnapshot = {
  syncedAt: string;
  source: {
    title: string;
    wikiUrl: string;
    tableName: string;
    syncMode: string;
    pollIntervalMs?: number;
    includedTables?: string[];
    excludedTables?: string[];
  };
  fields: SnapshotField[];
  ignoredFields?: SnapshotField[];
  records: SnapshotRecord[];
  summary?: {
    totalRecords: number;
    completedRecords: number;
    openRecords: number;
    byPriority?: Record<string, number>;
    byDepartment?: Record<string, number>;
  };
};

type ViewRecord = SnapshotRecord & {
  view: DerivedRecord;
  searchIndex: string;
};

type LoadState = "idle" | "loading" | "ready" | "error";
type SyncState = "idle" | "syncing";
type CountEntry = {
  label: string;
  count: number;
  ratio: number;
};

const SNAPSHOT_HREF = `${import.meta.env.BASE_URL}data/feishu-base-snapshot.json`;
const SYNC_API_HREF = "/api/design-projects/sync";
const CAN_SYNC_DESIGN_PROJECTS = import.meta.env.DEV;

const emptyDerivedRecord: DerivedRecord = {
  title: "未命名需求",
  completed: false,
  status: "未完成",
  priority: "未设置",
  proposer: "未设置",
  supplier: "未设置",
  assignee: "未设置",
  department: "未设置",
  channel: [],
  product: [],
  medium: [],
  visualScale: "未设置",
  size: "",
  createdAt: "",
  deadline: "",
  document: "",
  background: "",
  audience: "",
  successMetric: "",
  notice: "",
  attachmentCount: 0,
};

export function DesignProjectsWorkbench() {
  const [snapshot, setSnapshot] = useState<FeishuBaseSnapshot | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage("");

    try {
      const response = await fetch(`${SNAPSHOT_HREF}?t=${Date.now()}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`snapshot ${response.status}`);
      }

      const nextSnapshot = (await response.json()) as FeishuBaseSnapshot;
      setSnapshot(nextSnapshot);
      setLoadState("ready");
    } catch (error) {
      setLoadState("error");
      setErrorMessage(error instanceof Error ? error.message : "snapshot load failed");
    }
  }, []);

  const syncAndLoadSnapshot = useCallback(async () => {
    if (!CAN_SYNC_DESIGN_PROJECTS) {
      await loadSnapshot();
      return;
    }

    setSyncState("syncing");
    setLoadState("loading");
    setErrorMessage("");

    try {
      const response = await fetch(SYNC_API_HREF, {
        method: "POST",
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message ?? `sync ${response.status}`);
      }

      await loadSnapshot();
    } catch (error) {
      setLoadState(snapshot ? "ready" : "error");
      setErrorMessage(error instanceof Error ? error.message : "design project sync failed");
    } finally {
      setSyncState("idle");
    }
  }, [loadSnapshot, snapshot]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const records = useMemo<ViewRecord[]>(() => {
    return (snapshot?.records ?? [])
      .map((record) => {
        const view = normalizeDerived(record);
        const fieldText = Object.values(record.fields).map(valueToText).join(" ");

        return {
          ...record,
          view,
          searchIndex: [
            record.id,
            view.title,
            view.status,
            view.priority,
            view.proposer,
            view.supplier,
            view.assignee,
            view.department,
            view.channel.join(" "),
            view.product.join(" "),
            view.medium.join(" "),
            fieldText,
          ]
            .join(" ")
            .toLowerCase(),
        };
      })
      .sort(compareDesignProjectRecords);
  }, [snapshot]);

  const priorityOptions = useMemo(() => uniqueOptions(records, "priority"), [records]);
  const departmentOptions = useMemo(() => uniqueOptions(records, "department"), [records]);
  const analytics = useMemo(() => buildDesignProjectAnalytics(records), [records]);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (statusFilter !== "all" && record.view.status !== statusFilter) {
        return false;
      }
      if (priorityFilter !== "all" && record.view.priority !== priorityFilter) {
        return false;
      }
      if (departmentFilter !== "all" && record.view.department !== departmentFilter) {
        return false;
      }
      if (normalizedQuery && !record.searchIndex.includes(normalizedQuery)) {
        return false;
      }
      return true;
    });
  }, [departmentFilter, normalizedQuery, priorityFilter, records, statusFilter]);

  const selectedRecord =
    filteredRecords.find((record) => record.id === selectedId) ??
    filteredRecords[0] ??
    records[0] ??
    null;

  useEffect(() => {
    if (selectedRecord && selectedRecord.id !== selectedId) {
      setSelectedId(selectedRecord.id);
    }
  }, [selectedId, selectedRecord]);

  const summary = snapshot?.summary;

  if (loadState === "error" && !snapshot) {
    return (
      <div className="designProjectsWorkbench designProjectsWorkbench-empty">
        <section className="designProjectEmptyState">
          <Database size={18} />
          <div>
            <span className="sectionKicker">feishu base snapshot</span>
            <h2>设计项目快照未生成</h2>
            <p>运行 `npm run sync:design-projects` 后会生成只读 JSON 快照。</p>
            <small>{errorMessage}</small>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="designProjectsWorkbench">
      <section className="designProjectSyncBar">
        <div className="designProjectSource">
          <Database size={15} />
          <span>
            <strong>{snapshot?.source.title ?? "设计项目需求提报系统"}</strong>
            <small>
              {syncState === "syncing"
                ? "正在从 Feishu Base 拉取最新数据..."
                : errorMessage && snapshot
                  ? `同步失败：${errorMessage}`
                  : `${snapshot?.source.tableName ?? "设计项目需求提报"} / one-way snapshot / ${formatSyncTime(snapshot?.syncedAt)}`}
            </small>
          </span>
        </div>

        <div className="designProjectSyncActions">
          <span className="stateChip" data-state="selected">
            {summary?.totalRecords ?? records.length} tasks
          </span>
          {snapshot?.source.wikiUrl ? (
            <a
              className="barButton"
              href={snapshot.source.wikiUrl}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink size={13} />
              source
            </a>
          ) : null}
          <button
            className="barButton"
            type="button"
            aria-busy={syncState === "syncing"}
            disabled={loadState === "loading" || syncState === "syncing"}
            title={
              CAN_SYNC_DESIGN_PROJECTS
                ? "从 Feishu Base 拉取最新数据"
                : "刷新已发布的静态快照"
            }
            onClick={() => void syncAndLoadSnapshot()}
          >
            <RefreshCw className={syncState === "syncing" ? "syncSpin" : undefined} size={13} />
            {syncState === "syncing" ? "syncing" : "refresh"}
          </button>
        </div>
      </section>

      <section className="designProjectMetricStrip" aria-label="Design project status">
        <MetricCell label="total" value={summary?.totalRecords ?? records.length} />
        <MetricCell label="open" value={summary?.openRecords ?? records.filter((item) => !item.view.completed).length} />
        <MetricCell label="done" value={summary?.completedRecords ?? records.filter((item) => item.view.completed).length} />
        <MetricCell label="fields" value={snapshot?.fields.length ?? 0} />
        <MetricCell label="ignored" value={snapshot?.ignoredFields?.length ?? 0} />
      </section>

      <section className="designProjectToolbar" aria-label="Design project filters">
        <label className="designProjectSearch">
          <SearchCheck size={14} />
          <input
            type="search"
            name="design-project-task-query"
            autoComplete="off"
            autoCorrect="off"
            data-1p-ignore="true"
            data-lpignore="true"
            placeholder="搜索需求 / 负责人 / 渠道 / 产品"
            spellCheck={false}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query ? (
            <button type="button" aria-label="清除搜索" onClick={() => setQuery("")}>
              <X size={13} />
            </button>
          ) : null}
        </label>

        <FilterSelect
          label="status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={["已完成", "未完成"]}
        />
        <FilterSelect
          label="priority"
          value={priorityFilter}
          onChange={setPriorityFilter}
          options={priorityOptions}
        />
        <FilterSelect
          label="department"
          value={departmentFilter}
          onChange={setDepartmentFilter}
          options={departmentOptions}
        />

        <span className="designProjectResultCount">
          <SlidersHorizontal size={13} />
          {filteredRecords.length} / {records.length}
        </span>
      </section>

      <section className="designProjectAnalytics" aria-label="Design project analytics">
        <CompletionPanel
          done={analytics.done}
          open={analytics.open}
          rate={analytics.completionRate}
          total={analytics.total}
        />
        <DistributionPanel title="priority mix" entries={analytics.priorityEntries} />
        <DistributionPanel title="department top" entries={analytics.departmentEntries} />
        <DistributionPanel title="channel top" entries={analytics.channelEntries} />
        <OpenQueuePanel records={analytics.openQueue} />
      </section>

      <section className="designProjectContent">
        <aside className="designProjectListPanel" aria-label="设计项目需求列表">
          <header>
            <span>task list</span>
            <strong>{filteredRecords.length} records</strong>
          </header>
          <div className="designProjectList">
            {filteredRecords.map((record) => (
              <button
                className="designProjectRow"
                key={record.id}
                type="button"
                data-active={record.id === selectedRecord?.id}
                onClick={() => setSelectedId(record.id)}
              >
                <span className="designProjectRowState" data-completed={record.view.completed}>
                  {record.view.completed ? <CheckCircle2 size={13} /> : <FileText size={13} />}
                </span>
                <span className="designProjectRowCopy">
                  <strong>{record.view.title}</strong>
                  <small>
                    {record.view.department} / {record.view.priority} / {formatDate(record.view.deadline)}
                  </small>
                </span>
              </button>
            ))}
          </div>
        </aside>

        <article className="designProjectDetailPanel" aria-label="设计项目需求详情">
          {selectedRecord ? (
            <>
              <header className="designProjectDetailHeader">
                <div>
                  <span className="sectionKicker">{selectedRecord.view.status}</span>
                  <h2>{selectedRecord.view.title}</h2>
                </div>
                <span className="stateChip" data-state={selectedRecord.view.completed ? "success" : "selected"}>
                  {selectedRecord.view.priority}
                </span>
              </header>

              <div className="designProjectSummaryGrid">
                <SummaryItem label="deadline" value={formatDate(selectedRecord.view.deadline)} />
                <SummaryItem label="proposer" value={selectedRecord.view.proposer} />
                <SummaryItem label="assignee" value={selectedRecord.view.assignee} />
                <SummaryItem label="supplier" value={selectedRecord.view.supplier} />
                <SummaryItem label="department" value={selectedRecord.view.department} />
                <SummaryItem label="visual" value={selectedRecord.view.visualScale} />
              </div>

              <section className="designProjectTextBlocks">
                <TextBlock label="background" value={selectedRecord.view.background} />
                <TextBlock label="audience" value={selectedRecord.view.audience} />
                <TextBlock label="metric" value={selectedRecord.view.successMetric} />
                <TextBlock label="notice" value={selectedRecord.view.notice} />
              </section>

              <section className="designProjectFieldTable" aria-label="All synced fields">
                <header>
                  <span>all fields</span>
                  <strong>{snapshot?.fields.length ?? 0}</strong>
                </header>
                <div>
                  {(snapshot?.fields ?? []).map((field) => (
                    <div className="designProjectFieldRow" key={field.id}>
                      <span>
                        <strong>{field.name}</strong>
                        <small>{field.type ?? "unknown"}</small>
                      </span>
                      <FieldValue value={selectedRecord.fields[field.name]} />
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <div className="designProjectNoResults">
              <SearchCheck size={16} />
              <span>没有符合当前搜索和筛选条件的任务</span>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

type MetricCellProps = {
  label: string;
  value: number;
};

function MetricCell({ label, value }: MetricCellProps) {
  return (
    <div className="designProjectMetric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

type CompletionPanelProps = {
  total: number;
  open: number;
  done: number;
  rate: number;
};

function CompletionPanel({ total, open, done, rate }: CompletionPanelProps) {
  return (
    <div className="designProjectAnalyticsPanel">
      <header>
        <span>completion</span>
        <strong>{total} tasks</strong>
      </header>
      <div className="designProjectCompletionValue">
        <strong>{Math.round(rate)}%</strong>
        <span>done rate</span>
      </div>
      <div className="designProjectProgressTrack" aria-hidden="true">
        <i style={{ width: `${Math.max(2, rate)}%` }} />
      </div>
      <div className="designProjectAnalyticsSplit">
        <span>open {open}</span>
        <span>done {done}</span>
      </div>
    </div>
  );
}

type DistributionPanelProps = {
  title: string;
  entries: CountEntry[];
};

function DistributionPanel({ title, entries }: DistributionPanelProps) {
  return (
    <div className="designProjectAnalyticsPanel">
      <header>
        <span>{title}</span>
        <strong>{entries.length}</strong>
      </header>
      <div className="designProjectDistribution">
        {entries.map((entry) => (
          <div className="designProjectDistributionRow" key={entry.label}>
            <span>{entry.label}</span>
            <i aria-hidden="true">
              <b style={{ width: `${Math.max(4, entry.ratio * 100)}%` }} />
            </i>
            <strong>{entry.count}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

type OpenQueuePanelProps = {
  records: ViewRecord[];
};

function OpenQueuePanel({ records }: OpenQueuePanelProps) {
  return (
    <div className="designProjectAnalyticsPanel">
      <header>
        <span>open queue</span>
        <strong>{records.length}</strong>
      </header>
      <div className="designProjectOpenQueue">
        {records.map((record) => (
          <div className="designProjectOpenQueueRow" key={record.id}>
            <strong>{record.view.title}</strong>
            <span>
              {formatDate(record.view.deadline)} / {record.view.priority}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type FilterSelectProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="designProjectFilter">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="all">全部</option>
        {options.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

type SummaryItemProps = {
  label: string;
  value: string;
};

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div className="designProjectSummaryItem">
      <span>{label}</span>
      <strong>{value || "未设置"}</strong>
    </div>
  );
}

type TextBlockProps = {
  label: string;
  value: string;
};

function TextBlock({ label, value }: TextBlockProps) {
  if (!value) {
    return null;
  }

  return (
    <div className="designProjectTextBlock">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  );
}

type FieldValueProps = {
  value: unknown;
};

function FieldValue({ value }: FieldValueProps) {
  if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) {
    return <span className="designProjectEmptyValue">empty</span>;
  }

  if (Array.isArray(value)) {
    return (
      <span className="designProjectValueStack">
        {value.map((item, index) => (
          <span className="designProjectValuePill" key={`${valueToText(item)}-${index}`}>
            {valueToText(item)}
          </span>
        ))}
      </span>
    );
  }

  if (typeof value === "string") {
    const link = value.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);

    if (link) {
      return (
        <a className="designProjectFieldLink" href={link[2]} rel="noreferrer" target="_blank">
          {link[1]}
        </a>
      );
    }

    return <span className="designProjectLongValue">{value}</span>;
  }

  if (typeof value === "boolean") {
    return (
      <span className="designProjectValuePill" data-tone={value ? "success" : "neutral"}>
        {value ? "true" : "false"}
      </span>
    );
  }

  return <span className="designProjectLongValue">{valueToText(value)}</span>;
}

function normalizeDerived(record: SnapshotRecord): DerivedRecord {
  const derived = record.derived ?? {};

  return {
    ...emptyDerivedRecord,
    ...derived,
    title:
      derived.title ||
      valueToText(record.fields["需求名称 - Requirement Description * 必填项"]) ||
      record.id,
    completed: Boolean(derived.completed ?? record.fields["是否完成 - Status"]),
    status: derived.status || (record.fields["是否完成 - Status"] ? "已完成" : "未完成"),
    channel: normalizeStringArray(derived.channel),
    product: normalizeStringArray(derived.product),
    medium: normalizeStringArray(derived.medium),
    attachmentCount: Number(derived.attachmentCount ?? 0),
  };
}

function compareDesignProjectRecords(left: ViewRecord, right: ViewRecord) {
  if (left.view.completed !== right.view.completed) {
    return left.view.completed ? 1 : -1;
  }

  const rightTime = sortableProjectTime(right);
  const leftTime = sortableProjectTime(left);

  if (rightTime !== leftTime) {
    return rightTime - leftTime;
  }

  return left.view.title.localeCompare(right.view.title, "zh-Hans-CN");
}

function buildDesignProjectAnalytics(records: ViewRecord[]) {
  const total = records.length;
  const done = records.filter((record) => record.view.completed).length;
  const open = total - done;

  return {
    total,
    done,
    open,
    completionRate: total ? (done / total) * 100 : 0,
    priorityEntries: buildCountEntries(records, (record) => record.view.priority),
    departmentEntries: buildCountEntries(records, (record) => record.view.department),
    channelEntries: buildCountEntries(records, (record) => record.view.channel),
    openQueue: records.filter((record) => !record.view.completed).slice(0, 5),
  };
}

function buildCountEntries(
  records: ViewRecord[],
  getter: (record: ViewRecord) => string | string[],
  limit = 5,
): CountEntry[] {
  const counts = new Map<string, number>();

  records.forEach((record) => {
    const rawValues = getter(record);
    const values = Array.isArray(rawValues) ? rawValues : [rawValues];
    const normalizedValues = values.map((value) => value.trim()).filter(Boolean);

    if (normalizedValues.length === 0) {
      counts.set("未设置", (counts.get("未设置") ?? 0) + 1);
      return;
    }

    normalizedValues.forEach((value) => {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    });
  });

  const sortedEntries = Array.from(counts.entries())
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0], "zh-Hans-CN");
    })
    .slice(0, limit);
  const maxCount = Math.max(...sortedEntries.map(([, count]) => count), 1);

  return sortedEntries.map(([label, count]) => ({
    label,
    count,
    ratio: count / maxCount,
  }));
}

function sortableProjectTime(record: ViewRecord) {
  return parseProjectTime(record.view.deadline) || parseProjectTime(record.view.createdAt);
}

function parseProjectTime(value: string) {
  if (!value || value.startsWith("1970-01-01")) {
    return 0;
  }

  const normalizedValue = value.includes("T") ? value : value.replace(" ", "T");
  const timestamp = Date.parse(normalizedValue);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function uniqueOptions(records: ViewRecord[], key: keyof DerivedRecord) {
  return Array.from(
    new Set(
      records
        .map((record) => record.view[key])
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right, "zh-Hans-CN"));
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(valueToText).filter(Boolean);
  }

  const text = valueToText(value);
  return text ? [text] : [];
}

function valueToText(value: unknown): string {
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
    const objectValue = value as {
      name?: unknown;
      text?: unknown;
      url?: unknown;
      file_token?: unknown;
    };

    if (typeof objectValue.name === "string") {
      return objectValue.name;
    }
    if (typeof objectValue.text === "string") {
      return objectValue.text;
    }
    if (typeof objectValue.url === "string") {
      return objectValue.url;
    }
    if (typeof objectValue.file_token === "string") {
      return "attachment";
    }

    return JSON.stringify(value);
  }

  return "";
}

function formatDate(value: string) {
  if (!value || value.startsWith("1970-01-01")) {
    return "未设置";
  }

  return value.replace("T", " ").slice(0, 16);
}

function formatSyncTime(value?: string) {
  if (!value) {
    return "not synced";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.replace("T", " ").replace(/\.\d+Z$/, "");
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(/\//g, "-");
}
