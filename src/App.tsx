import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Archive,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Copy,
  Database,
  Folder,
  KeyRound,
  Layers3,
  Library,
  Lock,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  Workflow,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AccountRole, ToolId } from "./data/tools";
import {
  canAccessTool,
  getToolById,
  roles,
  toolItems,
} from "./data/tools";
import {
  buildFeishuOAuthUrl,
  createDemoFeishuAccount,
  loadFeishuAccount,
  saveFeishuAccount,
} from "./auth/feishu";
import type { FeishuAccount } from "./auth/feishu";
import { SliceTool } from "./tools/SliceTool";

type AccentTheme = {
  id: ThemePresetId;
  label: string;
};

type ThemePresetId =
  | "ghostty-carbon"
  | "ghostty-dune"
  | "ghostty-phosphor"
  | "ghostty-nebula"
  | "ghostty-paper"
  | "ghostty-rose";

type ThemeConfig = {
  accent: string;
  bg: string;
  bgDeep: string;
  surface: string;
  surfaceRaised: string;
  surfaceSoft: string;
  navHoverBg: string;
  navActiveBg: string;
  text: string;
  textSecondary: string;
  muted: string;
  border: string;
  danger: string;
  gridLine: string;
  uiFont: string;
  codeFont: string;
  uiFontSize: number;
  codeFontSize: number;
  translucentRail: boolean;
  contrast: number;
};

type ThemeMode = "light" | "dark" | "system";
type ThemePalette = Pick<
  ThemeConfig,
  | "accent"
  | "bg"
  | "bgDeep"
  | "surface"
  | "surfaceRaised"
  | "surfaceSoft"
  | "navHoverBg"
  | "navActiveBg"
  | "text"
  | "textSecondary"
  | "muted"
  | "border"
  | "danger"
  | "gridLine"
  | "contrast"
>;

const THEME_STORAGE_KEY = "vision-design-platform.theme-configs.ui3.ghostty.v2";
const THEME_MODE_STORAGE_KEY = "vision-design-platform.theme-mode.ui3.ghostty.v2";
const ACTIVE_THEME_STORAGE_KEY = "vision-design-platform.active-theme.ui3.ghostty.v2";
const DEFAULT_THEME_ID: ThemePresetId = "ghostty-carbon";

const monoStack =
  "SF Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace";

const themePresets: AccentTheme[] = [
  { id: "ghostty-carbon", label: "ghostty carbon" },
  { id: "ghostty-dune", label: "ghostty dune" },
  { id: "ghostty-phosphor", label: "ghostty phosphor" },
  { id: "ghostty-nebula", label: "ghostty nebula" },
  { id: "ghostty-paper", label: "ghostty paper" },
  { id: "ghostty-rose", label: "ghostty rose" },
];

const defaultThemeConfigs: Record<ThemePresetId, ThemeConfig> = {
  "ghostty-carbon": {
    accent: "#7AB7FF",
    bg: "#101113",
    bgDeep: "#0B0C0E",
    surface: "#16181B",
    surfaceRaised: "#1C1F23",
    surfaceSoft: "#121417",
    navHoverBg: "#181B1F",
    navActiveBg: "#17243A",
    text: "#E7EAF0",
    textSecondary: "#A7ADB8",
    muted: "#696F7A",
    border: "#30343B",
    danger: "#FF6B63",
    gridLine: "#FFFFFF",
    uiFont: monoStack,
    codeFont: monoStack,
    uiFontSize: 14,
    codeFontSize: 14,
    translucentRail: false,
    contrast: 64,
  },
  "ghostty-dune": {
    accent: "#D9A05B",
    bg: "#171410",
    bgDeep: "#110F0C",
    surface: "#211D17",
    surfaceRaised: "#282219",
    surfaceSoft: "#1B1813",
    navHoverBg: "#252016",
    navActiveBg: "#382716",
    text: "#EFE7D7",
    textSecondary: "#B4A895",
    muted: "#756B59",
    border: "#3A3328",
    danger: "#F06C5E",
    gridLine: "#F2E5CC",
    uiFont: monoStack,
    codeFont: monoStack,
    uiFontSize: 14,
    codeFontSize: 14,
    translucentRail: false,
    contrast: 58,
  },
  "ghostty-phosphor": {
    accent: "#65D46E",
    bg: "#0F1612",
    bgDeep: "#0A100D",
    surface: "#141D17",
    surfaceRaised: "#1A241D",
    surfaceSoft: "#111912",
    navHoverBg: "#172018",
    navActiveBg: "#173421",
    text: "#DDEFE1",
    textSecondary: "#A1B6A7",
    muted: "#627368",
    border: "#2B3B31",
    danger: "#EA6B5B",
    gridLine: "#BDEFC4",
    uiFont: monoStack,
    codeFont: monoStack,
    uiFontSize: 14,
    codeFontSize: 14,
    translucentRail: false,
    contrast: 62,
  },
  "ghostty-nebula": {
    accent: "#B08CFF",
    bg: "#12111B",
    bgDeep: "#0D0C14",
    surface: "#181725",
    surfaceRaised: "#201E31",
    surfaceSoft: "#151421",
    navHoverBg: "#1D1B2B",
    navActiveBg: "#2A2147",
    text: "#EAE6FF",
    textSecondary: "#ACA6C7",
    muted: "#6B6483",
    border: "#363149",
    danger: "#FF6B83",
    gridLine: "#D8CBFF",
    uiFont: monoStack,
    codeFont: monoStack,
    uiFontSize: 14,
    codeFontSize: 14,
    translucentRail: false,
    contrast: 64,
  },
  "ghostty-paper": {
    accent: "#8DB4FF",
    bg: "#12110F",
    bgDeep: "#0C0B0A",
    surface: "#191714",
    surfaceRaised: "#211E1A",
    surfaceSoft: "#151310",
    navHoverBg: "#1D1A16",
    navActiveBg: "#1B2940",
    text: "#EFE8D8",
    textSecondary: "#B4AA98",
    muted: "#766E61",
    border: "#383226",
    danger: "#E56A5E",
    gridLine: "#F7EBD6",
    uiFont: monoStack,
    codeFont: monoStack,
    uiFontSize: 14,
    codeFontSize: 14,
    translucentRail: false,
    contrast: 56,
  },
  "ghostty-rose": {
    accent: "#EB6F92",
    bg: "#17131A",
    bgDeep: "#100D13",
    surface: "#1F1923",
    surfaceRaised: "#26202C",
    surfaceSoft: "#1A151F",
    navHoverBg: "#231B27",
    navActiveBg: "#3A1E2B",
    text: "#F1E8EC",
    textSecondary: "#B9A9B1",
    muted: "#766876",
    border: "#3C303B",
    danger: "#F06C5E",
    gridLine: "#FFE3EC",
    uiFont: monoStack,
    codeFont: monoStack,
    uiFontSize: 14,
    codeFontSize: 14,
    translucentRail: false,
    contrast: 62,
  },
};

const lightThemeConfigs: Record<ThemePresetId, ThemePalette> = {
  "ghostty-carbon": {
    accent: "#2563EB",
    bg: "#F6F8FB",
    bgDeep: "#E8EDF4",
    surface: "#EEF2F7",
    surfaceRaised: "#FFFFFF",
    surfaceSoft: "#E7ECF3",
    navHoverBg: "#E2E8F0",
    navActiveBg: "#DCEBFF",
    text: "#16191D",
    textSecondary: "#4B5563",
    muted: "#7A8594",
    border: "#CBD3DF",
    danger: "#D64C45",
    gridLine: "#1A2433",
    contrast: 52,
  },
  "ghostty-dune": {
    accent: "#B7791F",
    bg: "#F7F1E6",
    bgDeep: "#E8DDCC",
    surface: "#EEE4D3",
    surfaceRaised: "#FFF9EF",
    surfaceSoft: "#E6DAC8",
    navHoverBg: "#E2D4BF",
    navActiveBg: "#F2DEC1",
    text: "#241C13",
    textSecondary: "#665543",
    muted: "#8D806E",
    border: "#D7C8B2",
    danger: "#C94C43",
    gridLine: "#2B2117",
    contrast: 50,
  },
  "ghostty-phosphor": {
    accent: "#168C55",
    bg: "#F1F8F2",
    bgDeep: "#E2EFE5",
    surface: "#EAF4EC",
    surfaceRaised: "#FCFFFC",
    surfaceSoft: "#E1ECE4",
    navHoverBg: "#DAE8DE",
    navActiveBg: "#D7F1DF",
    text: "#17241B",
    textSecondary: "#45564A",
    muted: "#738077",
    border: "#C8D7CC",
    danger: "#C94C43",
    gridLine: "#1E3325",
    contrast: 50,
  },
  "ghostty-nebula": {
    accent: "#6D5CE7",
    bg: "#F6F3FF",
    bgDeep: "#E9E3F6",
    surface: "#EFEAFB",
    surfaceRaised: "#FFFCFF",
    surfaceSoft: "#E8E1F3",
    navHoverBg: "#E2D9F0",
    navActiveBg: "#E5DEFF",
    text: "#211C32",
    textSecondary: "#57506F",
    muted: "#817993",
    border: "#D3C9E4",
    danger: "#C94C60",
    gridLine: "#2A2340",
    contrast: 52,
  },
  "ghostty-paper": {
    accent: "#2B73E0",
    bg: "#F8F7F4",
    bgDeep: "#EFEDE8",
    surface: "#F3F1EC",
    surfaceRaised: "#FFFEFB",
    surfaceSoft: "#ECE9E3",
    navHoverBg: "#E9E7E1",
    navActiveBg: "#DCEBFF",
    text: "#1A1918",
    textSecondary: "#4A4744",
    muted: "#7A7673",
    border: "#D4D1CB",
    danger: "#DC2626",
    gridLine: "#1A1918",
    contrast: 54,
  },
  "ghostty-rose": {
    accent: "#D14D72",
    bg: "#FFF5F8",
    bgDeep: "#F0E2E7",
    surface: "#F8EBF0",
    surfaceRaised: "#FFFCFD",
    surfaceSoft: "#F0E3E8",
    navHoverBg: "#ECDCE3",
    navActiveBg: "#F8DCE7",
    text: "#2A1B23",
    textSecondary: "#664B58",
    muted: "#927D86",
    border: "#DBC8D0",
    danger: "#B9474D",
    gridLine: "#331D28",
    contrast: 52,
  },
};

const primaryDomains: Array<{
  id: string;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "overview", label: "中台总览", icon: Activity },
  { id: "asset-governance", label: "资产治理", icon: Database },
  { id: "spec-system", label: "规范体系", icon: Library },
  { id: "component-system", label: "组件系统", icon: Layers3 },
  { id: "workflow", label: "流程协同", icon: Workflow },
  { id: "insight", label: "数据洞察", icon: BarChart3 },
];

const moduleItems: Array<{
  id: string;
  label: string;
  note: string;
  icon: LucideIcon;
  toolId: ToolId;
}> = [
  {
    id: "asset-map",
    label: "设计资产地图",
    note: "files / owners / spaces",
    icon: Database,
    toolId: "open-design",
  },
  {
    id: "token-governance",
    label: "Token 管理",
    note: "colors / type / radius",
    icon: Palette,
    toolId: "settings",
  },
  {
    id: "component-governance",
    label: "组件库治理",
    note: "variants / risk / review",
    icon: Layers3,
    toolId: "figma-projects",
  },
  {
    id: "templates",
    label: "模板与页面",
    note: "scenarios / publish",
    icon: Library,
    toolId: "templates",
  },
  {
    id: "review",
    label: "走查与标注",
    note: "diffs / blocking / queue",
    icon: SearchCheck,
    toolId: "mage-gallery",
  },
  {
    id: "release",
    label: "发布与版本",
    note: "release / hotfix",
    icon: Archive,
    toolId: "uploads",
  },
  {
    id: "assistant",
    label: "AI 规范助手",
    note: "suggestions / naming",
    icon: Sparkles,
    toolId: "settings",
  },
  {
    id: "data",
    label: "数据监控",
    note: "reuse / quality / trend",
    icon: BarChart3,
    toolId: "mage-gallery",
  },
  {
    id: "access",
    label: "权限与空间",
    note: "teams / audit",
    icon: ShieldCheck,
    toolId: "settings",
  },
];

const toolWorkMeta: Record<
  ToolId,
  {
    l2Label: string;
    status: string;
    queue: string;
    quality: string;
    description: string;
  }
> = {
  "open-design": {
    l2Label: "工作台",
    status: "indexed",
    queue: "12 assets",
    quality: "ready",
    description: "Open Design 仓库入口与项目编排位。",
  },
  "slice-export": {
    l2Label: "资产地图",
    status: "local tool",
    queue: "image slices",
    quality: "ready",
    description: "图片切片、预览和 ZIP 导出。",
  },
  "figma-projects": {
    l2Label: "组件库",
    status: "space linked",
    queue: "4 projects",
    quality: "viewer",
    description: "Figma 项目、空间和权限治理入口。",
  },
  "mage-gallery": {
    l2Label: "质量巡检",
    status: "gallery",
    queue: "review queue",
    quality: "draft",
    description: "Mage Gallery 资产巡检和灵感归档位。",
  },
  templates: {
    l2Label: "模板市场",
    status: "template",
    queue: "page kits",
    quality: "draft",
    description: "模板、页面结构和复用标准的管理位。",
  },
  uploads: {
    l2Label: "发布流",
    status: "upload",
    queue: "pending",
    quality: "draft",
    description: "上传、发布和版本流转入口。",
  },
  settings: {
    l2Label: "Token 管理",
    status: "tokens",
    queue: "config table",
    quality: "live",
    description: "颜色、字体、字号、导航状态和渲染 token。",
  },
};

function resolveThemeMode(mode: ThemeMode) {
  if (mode !== "system") {
    return mode;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

function isThemePresetId(value: string | null): value is ThemePresetId {
  return themePresets.some((theme) => theme.id === value);
}

function loadActiveTheme() {
  const storedTheme = window.localStorage.getItem(ACTIVE_THEME_STORAGE_KEY);

  return isThemePresetId(storedTheme) ? storedTheme : DEFAULT_THEME_ID;
}

const roleLabel = (role: AccountRole | null) =>
  roles.find((item) => item.id === role)?.label ?? "Guest";

function normalizeHex(value: string) {
  const trimmed = value.trim();
  const short = /^#([0-9a-f]{3})$/i.exec(trimmed);

  if (short) {
    return `#${short[1]
      .split("")
      .map((character) => character + character)
      .join("")
      .toUpperCase()}`;
  }

  if (/^#[0-9a-f]{6}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return null;
}

function colorValue(value: string, fallback: string) {
  return normalizeHex(value) ?? normalizeHex(fallback) ?? fallback;
}

function hexToRgba(value: string, alpha: number) {
  const hex = colorValue(value, "#000000").slice(1);
  const channel = (index: number) => parseInt(hex.slice(index, index + 2), 16);

  return `rgba(${channel(0)}, ${channel(2)}, ${channel(4)}, ${alpha})`;
}

function blendHex(foreground: string, background: string, alpha: number) {
  const foregroundHex = colorValue(foreground, "#000000").slice(1);
  const backgroundHex = colorValue(background, "#000000").slice(1);
  const channel = (hex: string, index: number) =>
    parseInt(hex.slice(index, index + 2), 16);
  const blendedChannel = (index: number) =>
    Math.round(
      channel(foregroundHex, index) * alpha +
        channel(backgroundHex, index) * (1 - alpha),
    );

  return `#${[0, 2, 4]
    .map((index) => blendedChannel(index).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function makeNavActiveBg(accent: string, mode: "light" | "dark") {
  return blendHex(accent, mode === "light" ? "#F8F7F4" : "#141210", 0.24);
}

function getThemeModeConfig(
  themeId: ThemePresetId,
  mode: ThemeMode,
  previousConfig?: ThemeConfig,
) {
  const resolvedMode = resolveThemeMode(mode);
  const baseConfig = defaultThemeConfigs[themeId];
  const palette =
    resolvedMode === "light" ? lightThemeConfigs[themeId] : defaultThemeConfigs[themeId];

  return {
    ...baseConfig,
    ...previousConfig,
    ...palette,
    uiFont: previousConfig?.uiFont ?? baseConfig.uiFont,
    codeFont: previousConfig?.codeFont ?? baseConfig.codeFont,
    uiFontSize: previousConfig?.uiFontSize ?? baseConfig.uiFontSize,
    codeFontSize: previousConfig?.codeFontSize ?? baseConfig.codeFontSize,
    translucentRail:
      previousConfig?.translucentRail ?? baseConfig.translucentRail,
  };
}

function relativeLuminance(value: string) {
  const hex = colorValue(value, "#000000").slice(1);
  const channel = (index: number) => parseInt(hex.slice(index, index + 2), 16);
  const normalize = (valueToNormalize: number) => {
    const normalized = valueToNormalize / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };

  const red = normalize(channel(0));
  const green = normalize(channel(2));
  const blue = normalize(channel(4));

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function mergeThemeConfigs(
  configs?: Partial<Record<ThemePresetId, Partial<ThemeConfig>>>,
) {
  return themePresets.reduce(
    (result, preset) => {
      const storedConfig = configs?.[preset.id] ?? {};
      const mergedConfig = {
        ...defaultThemeConfigs[preset.id],
        ...storedConfig,
      };
      const inferredMode =
        relativeLuminance(mergedConfig.bg) > 0.62 ? "light" : "dark";

      if (!storedConfig.navHoverBg) {
        mergedConfig.navHoverBg =
          inferredMode === "light" ? "#E9E7E1" : mergedConfig.surface;
      }

      if (!storedConfig.navActiveBg) {
        mergedConfig.navActiveBg = makeNavActiveBg(
          mergedConfig.accent,
          inferredMode,
        );
      }

      result[preset.id] = mergedConfig;
      return result;
    },
    {} as Record<ThemePresetId, ThemeConfig>,
  );
}

function applyThemeModeToConfigs(
  configs: Record<ThemePresetId, ThemeConfig>,
  mode: ThemeMode,
) {
  return themePresets.reduce(
    (result, preset) => {
      result[preset.id] = getThemeModeConfig(
        preset.id,
        mode,
        configs[preset.id],
      );
      return result;
    },
    {} as Record<ThemePresetId, ThemeConfig>,
  );
}

function loadThemeConfigs(mode: ThemeMode) {
  const raw = window.localStorage.getItem(THEME_STORAGE_KEY);

  if (!raw) {
    return applyThemeModeToConfigs(mergeThemeConfigs(), mode);
  }

  try {
    return mergeThemeConfigs(JSON.parse(raw));
  } catch {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
    return applyThemeModeToConfigs(mergeThemeConfigs(), mode);
  }
}

function loadThemeMode() {
  const mode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
  return isThemeMode(mode) ? mode : "dark";
}

function getThemeTone(config: ThemeConfig, mode: ThemeMode) {
  const resolvedMode = resolveThemeMode(mode);

  if (resolvedMode === "light") {
    return "light";
  }

  return relativeLuminance(config.bg) > 0.62 ? "light" : "dark";
}

function makeThemeStyle(config: ThemeConfig) {
  const contrast = Math.min(Math.max(config.contrast, 20), 100);
  const uiFontSize = Math.min(Math.max(config.uiFontSize ?? 14, 12), 20);
  const codeFontSize = Math.min(Math.max(config.codeFontSize ?? 14, 12), 20);
  const softAlpha = 0.06 + contrast / 620;
  const faintAlpha = 0.025 + contrast / 2100;
  const borderAlpha = 0.24 + contrast / 250;
  const accent = colorValue(config.accent, defaultThemeConfigs[DEFAULT_THEME_ID].accent);
  const accentOn = relativeLuminance(accent) > 0.42 ? "#141210" : "#FFFFFF";

  return {
    "--accent": accent,
    "--accent-on": accentOn,
    "--accent-soft": hexToRgba(config.accent, softAlpha),
    "--accent-faint": hexToRgba(config.accent, faintAlpha),
    "--accent-border": hexToRgba(config.accent, borderAlpha),
    "--bg": colorValue(config.bg, defaultThemeConfigs[DEFAULT_THEME_ID].bg),
    "--bg-deep": colorValue(config.bgDeep, defaultThemeConfigs[DEFAULT_THEME_ID].bgDeep),
    "--surface": colorValue(config.surface, defaultThemeConfigs[DEFAULT_THEME_ID].surface),
    "--surface-raised": colorValue(
      config.surfaceRaised,
      defaultThemeConfigs[DEFAULT_THEME_ID].surfaceRaised,
    ),
    "--surface-soft": colorValue(
      config.surfaceSoft,
      defaultThemeConfigs[DEFAULT_THEME_ID].surfaceSoft,
    ),
    "--nav-hover-bg": colorValue(
      config.navHoverBg,
      defaultThemeConfigs[DEFAULT_THEME_ID].navHoverBg,
    ),
    "--nav-active-bg": colorValue(
      config.navActiveBg,
      defaultThemeConfigs[DEFAULT_THEME_ID].navActiveBg,
    ),
    "--text": colorValue(config.text, defaultThemeConfigs[DEFAULT_THEME_ID].text),
    "--text-secondary": colorValue(
      config.textSecondary,
      defaultThemeConfigs[DEFAULT_THEME_ID].textSecondary,
    ),
    "--muted": colorValue(config.muted, defaultThemeConfigs[DEFAULT_THEME_ID].muted),
    "--border": colorValue(config.border, defaultThemeConfigs[DEFAULT_THEME_ID].border),
    "--border-soft": hexToRgba(config.border, 0.72),
    "--danger": colorValue(config.danger, defaultThemeConfigs[DEFAULT_THEME_ID].danger),
    "--grid-line": hexToRgba(config.gridLine, 0.018),
    "--workspace-bar-bg": hexToRgba(config.bg, 0.92),
    "--rail-bg": config.translucentRail
      ? hexToRgba(config.bgDeep, 0.86)
      : colorValue(config.bgDeep, defaultThemeConfigs[DEFAULT_THEME_ID].bgDeep),
    "--ui-font": config.uiFont,
    "--code-font": config.codeFont,
    "--ui-font-size": `${uiFontSize}px`,
    "--code-font-size": `${codeFontSize}px`,
  } as React.CSSProperties;
}

export function App() {
  const [activeToolId, setActiveToolId] = useState<ToolId>("open-design");
  const [activeDomain, setActiveDomain] = useState("asset-governance");
  const [account, setAccount] = useState<FeishuAccount | null>(() =>
    loadFeishuAccount(),
  );
  const [accentTheme, setAccentTheme] =
    useState<AccentTheme["id"]>(() => loadActiveTheme());
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => loadThemeMode());
  const [themeConfigs, setThemeConfigs] = useState(() =>
    loadThemeConfigs(loadThemeMode()),
  );
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    saveFeishuAccount(account);
  }, [account]);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeConfigs));
  }, [themeConfigs]);

  useEffect(() => {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
  }, [themeMode]);

  const activeTool = useMemo(() => getToolById(activeToolId), [activeToolId]);
  const role = account?.role ?? null;
  const activeAllowed = canAccessTool(role, activeTool);
  const activeThemeConfig = themeConfigs[accentTheme];
  const themeTone = getThemeTone(activeThemeConfig, themeMode);
  const themeStyle = useMemo(
    () => makeThemeStyle(activeThemeConfig),
    [activeThemeConfig],
  );
  const activeModule =
    moduleItems.find((item) => item.toolId === activeToolId) ?? moduleItems[0];
  const activeMeta = toolWorkMeta[activeToolId];

  function signIn(roleToUse: AccountRole) {
    setAccount(createDemoFeishuAccount(roleToUse));
    setAuthOpen(false);
  }

  function signOut() {
    setAccount(null);
    setAuthOpen(false);
  }

  function changeRole(nextRole: AccountRole) {
    if (!account) {
      return;
    }

    setAccount({ ...account, role: nextRole });
  }

  function updateActiveThemeConfig(partialConfig: Partial<ThemeConfig>) {
    setThemeConfigs((configs) => ({
      ...configs,
      [accentTheme]: {
        ...configs[accentTheme],
        ...partialConfig,
      },
    }));
  }

  function resetActiveThemeConfig() {
    setThemeConfigs((configs) => ({
      ...configs,
      [accentTheme]: getThemeModeConfig(accentTheme, themeMode),
    }));
  }

  function changeThemeMode(nextMode: ThemeMode) {
    setThemeMode(nextMode);
    setThemeConfigs((configs) => applyThemeModeToConfigs(configs, nextMode));
  }

  function saveSettingsSnapshot() {
    window.localStorage.setItem(ACTIVE_THEME_STORAGE_KEY, accentTheme);
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeConfigs));
  }

  function renderCanvas() {
    if (activeToolId === "settings") {
      return (
        <SettingsPanel
          activeTheme={accentTheme}
          config={activeThemeConfig}
          themeMode={themeMode}
          themeConfigs={themeConfigs}
          onReset={resetActiveThemeConfig}
          onSaveSettings={saveSettingsSnapshot}
          onThemeChange={setAccentTheme}
          onThemeModeChange={changeThemeMode}
          onUpdate={updateActiveThemeConfig}
        />
      );
    }

    if (!activeAllowed) {
      return (
        <button className="lockedPanel" type="button" onClick={() => setAuthOpen(true)}>
          <Lock size={16} />
          <span>{account ? "permission required" : "feishu login required"}</span>
        </button>
      );
    }

    if (activeToolId === "slice-export") {
      return <SliceTool />;
    }

    return <ToolPlaceholder activeToolId={activeToolId} />;
  }

  return (
    <div
      className="appShell"
      data-accent={accentTheme}
      data-theme-tone={themeTone}
      style={themeStyle}
    >
      <header className="l1Bar">
        <div className="brandCluster">
          <span className="brandMark" aria-hidden="true">
            <img src="/team-icon.png" alt="" />
          </span>
          <button className="workspaceMenu" type="button">
            <span>vision</span>
            <ChevronDown size={13} />
          </button>
        </div>

        <nav className="l1Nav" aria-label="Primary domains">
          {primaryDomains.map((domain) => {
            const Icon = domain.icon;

            return (
              <button
                key={domain.id}
                className="l1NavItem"
                type="button"
                data-active={domain.id === activeDomain}
                onClick={() => setActiveDomain(domain.id)}
              >
                <Icon size={14} />
                <span>{domain.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="l1Actions">
          <ThemePicker
            activeTheme={accentTheme}
            themeConfigs={themeConfigs}
            onThemeChange={setAccentTheme}
          />
          <AccountControl
            account={account}
            onAuthOpen={() => setAuthOpen(true)}
            onRoleChange={changeRole}
            onSignOut={signOut}
          />
        </div>
      </header>

      <header className="l2Bar">
        <div className="breadcrumb" aria-label="Current tool">
          <span>vision</span>
          <span>/</span>
          <strong>{activeMeta.l2Label}</strong>
        </div>

        <nav className="l2Tabs" aria-label="Secondary views">
          {toolItems.map((tool) => {
            const Icon = tool.icon;
            const allowed = canAccessTool(role, tool);

            return (
              <button
                key={tool.id}
                className="l2Tab"
                type="button"
                data-active={tool.id === activeToolId}
                data-disabled={!allowed}
                onClick={() => setActiveToolId(tool.id)}
              >
                <Icon size={18} />
                <span>{tool.shortLabel}</span>
                {!allowed ? <Lock className="tabLock" size={11} /> : null}
              </button>
            );
          })}
        </nav>

        <div className="l2Meta">
          <span className="stateChip" data-state="selected">
            {activeMeta.status}
          </span>
          <span className="stateChip" data-state="neutral">
            {roleLabel(role)}
          </span>
        </div>
      </header>

      <main className="l3Workspace">
        <aside className="moduleRail" aria-label="Functional modules">
          <header className="railHeader">
            <span>L3 modules</span>
            <strong>设计工作台</strong>
          </header>

          <nav className="moduleList">
            {moduleItems.map((item) => {
              const Icon = item.icon;
              const allowed = canAccessTool(role, getToolById(item.toolId));

              return (
                <button
                  key={item.id}
                  className="moduleButton"
                  type="button"
                  data-active={item.id === activeModule.id}
                  data-disabled={!allowed}
                  onClick={() => setActiveToolId(item.toolId)}
                >
                  <Icon size={18} />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.note}</small>
                  </span>
                  {!allowed ? <Lock size={11} /> : null}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="moduleCanvas" aria-label={`${activeTool.label} workspace`}>
          <header className="canvasHeader">
            <div>
              <span>{activeModule.label}</span>
              <h1>{activeTool.label}</h1>
            </div>
            <div className="canvasActions">
              <span className="stateChip" data-state="success">
                <CheckCircle2 size={12} />
                {activeMeta.quality}
              </span>
              <span className="stateChip" data-state="neutral">
                {activeMeta.queue}
              </span>
            </div>
          </header>
          <div
            className={`canvasBody canvasBody-${activeToolId}`}
            data-locked={!activeAllowed}
          >
            {renderCanvas()}
          </div>
        </section>

        <InspectorPanel
          account={account}
          activeMeta={activeMeta}
          activeModule={activeModule}
          activeTheme={accentTheme}
          activeToolId={activeToolId}
          config={activeThemeConfig}
          role={role}
          themeMode={themeMode}
          onAuthOpen={() => setAuthOpen(true)}
        />
      </main>

      {authOpen ? (
        <AuthDialog
          account={account}
          onClose={() => setAuthOpen(false)}
          onRoleChange={changeRole}
          onSignIn={signIn}
          onSignOut={signOut}
        />
      ) : null}
    </div>
  );
}

type ToolPlaceholderProps = {
  activeToolId: ToolId;
};

function ToolPlaceholder({ activeToolId }: ToolPlaceholderProps) {
  const tool = getToolById(activeToolId);
  const meta = toolWorkMeta[activeToolId];
  const rows = [
    ["owner", "Design Platform"],
    ["source", tool.label],
    ["queue", meta.queue],
    ["status", meta.status],
  ];

  return (
    <div className="emptyWorkbench">
      <section className="emptyModulePanel">
        <div>
          <span className="sectionKicker">module placeholder</span>
          <h2>{tool.label}</h2>
          <p>{meta.description}</p>
        </div>
        <div className="stateMatrix">
          {rows.map(([label, value]) => (
            <div className="stateMatrixRow" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="canvasPreviewGrid" aria-label="Workbench preview">
        {Array.from({ length: 9 }, (_, index) => (
          <div className="previewCell" key={index}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>
              {index % 3 === 0
                ? "asset"
                : index % 3 === 1
                  ? "token"
                  : "review"}
            </strong>
            <small>{index % 2 === 0 ? "ready" : "queued"}</small>
          </div>
        ))}
      </section>
    </div>
  );
}

type InspectorPanelProps = {
  account: FeishuAccount | null;
  activeMeta: (typeof toolWorkMeta)[ToolId];
  activeModule: (typeof moduleItems)[number];
  activeTheme: ThemePresetId;
  activeToolId: ToolId;
  config: ThemeConfig;
  role: AccountRole | null;
  themeMode: ThemeMode;
  onAuthOpen: () => void;
};

function InspectorPanel({
  account,
  activeMeta,
  activeModule,
  activeTheme,
  activeToolId,
  config,
  role,
  themeMode,
  onAuthOpen,
}: InspectorPanelProps) {
  const activeTool = getToolById(activeToolId);
  const permissionRows = toolItems.slice(0, 5).map((tool) => ({
    label: tool.shortLabel,
    enabled: canAccessTool(role, tool),
  }));

  return (
    <aside className="inspectorPanel" aria-label="Inspector">
      <section className="inspectorSection">
        <header>
          <span>selection</span>
          <strong>{activeModule.label}</strong>
        </header>
        <div className="inspectorRows">
          <InspectorRow label="tool" value={activeTool.shortLabel} />
          <InspectorRow label="state" value={activeMeta.status} />
          <InspectorRow label="queue" value={activeMeta.queue} />
          <InspectorRow label="quality" value={activeMeta.quality} />
        </div>
      </section>

      <section className="inspectorSection">
        <header>
          <span>account</span>
          <strong>{roleLabel(role)}</strong>
        </header>
        {account ? (
          <div className="accountInline">
            <span className="avatar">{account.name.slice(0, 1).toUpperCase()}</span>
            <div>
              <strong>{account.name}</strong>
              <small>{account.email}</small>
            </div>
          </div>
        ) : (
          <button className="barButton fullWidthButton" type="button" onClick={onAuthOpen}>
            <LogIn size={15} />
            <span>feishu login</span>
          </button>
        )}
        <div className="permissionStack">
          {permissionRows.map((item) => (
            <div className="permissionRow" key={item.label} data-enabled={item.enabled}>
              <span>{item.label}</span>
              {item.enabled ? <ShieldCheck size={14} /> : <Lock size={14} />}
            </div>
          ))}
        </div>
      </section>

      <section className="inspectorSection">
        <header>
          <span>tokens</span>
          <strong>{themePresets.find((item) => item.id === activeTheme)?.label}</strong>
        </header>
        <div className="tokenPreviewRows">
          <TokenPreview label="accent" value={config.accent} />
          <TokenPreview label="surface" value={config.surface} />
          <TokenPreview label="nav active" value={config.navActiveBg} />
          <TokenPreview label="border" value={config.border} />
        </div>
      </section>

      <section className="inspectorSection">
        <header>
          <span>render</span>
          <strong>{themeMode}</strong>
        </header>
        <div className="inspectorRows">
          <InspectorRow label="ui size" value={`${config.uiFontSize}px`} />
          <InspectorRow label="code size" value={`${config.codeFontSize}px`} />
          <InspectorRow label="radius" value="4px" />
          <InspectorRow label="stroke" value="0.5px" />
        </div>
      </section>
    </aside>
  );
}

type InspectorRowProps = {
  label: string;
  value: string;
};

function InspectorRow({ label, value }: InspectorRowProps) {
  return (
    <div className="inspectorRow">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

type TokenPreviewProps = {
  label: string;
  value: string;
};

function TokenPreview({ label, value }: TokenPreviewProps) {
  return (
    <div className="tokenPreview">
      <span>{label}</span>
      <strong>
        <i style={{ background: colorValue(value, "#000000") }} />
        {value}
      </strong>
    </div>
  );
}

type ThemePickerProps = {
  activeTheme: AccentTheme["id"];
  themeConfigs: Record<ThemePresetId, ThemeConfig>;
  onThemeChange: (theme: AccentTheme["id"]) => void;
};

function ThemePicker({ activeTheme, themeConfigs, onThemeChange }: ThemePickerProps) {
  return (
    <div className="themePicker" aria-label="Theme color">
      <Palette size={14} />
      {themePresets.map((theme) => (
        <button
          key={theme.id}
          className="swatchButton"
          style={{ "--swatch": themeConfigs[theme.id].accent } as React.CSSProperties}
          data-active={theme.id === activeTheme}
          title={theme.label}
          aria-label={theme.label}
          onClick={() => onThemeChange(theme.id)}
        />
      ))}
    </div>
  );
}

type SettingsPanelProps = {
  activeTheme: ThemePresetId;
  config: ThemeConfig;
  themeMode: ThemeMode;
  themeConfigs: Record<ThemePresetId, ThemeConfig>;
  onReset: () => void;
  onSaveSettings: () => void;
  onThemeChange: (theme: ThemePresetId) => void;
  onThemeModeChange: (mode: ThemeMode) => void;
  onUpdate: (config: Partial<ThemeConfig>) => void;
};

const colorRows: Array<{
  key: keyof Pick<
    ThemeConfig,
    | "accent"
    | "bg"
    | "bgDeep"
    | "surface"
    | "surfaceRaised"
    | "surfaceSoft"
    | "navHoverBg"
    | "navActiveBg"
    | "text"
    | "textSecondary"
    | "muted"
    | "border"
    | "danger"
    | "gridLine"
  >;
  label: string;
  note: string;
}> = [
  { key: "accent", label: "强调色", note: "active / focus" },
  { key: "bg", label: "页面背景", note: "--bg" },
  { key: "bgDeep", label: "底层背景", note: "--bg-deep" },
  { key: "surface", label: "基础面板", note: "--surface" },
  { key: "surfaceRaised", label: "浮层面板", note: "--surface-raised" },
  { key: "surfaceSoft", label: "弱面板", note: "--surface-soft" },
  { key: "navHoverBg", label: "导航悬停背景", note: "--nav-hover-bg" },
  { key: "navActiveBg", label: "导航选中背景", note: "--nav-active-bg" },
  { key: "text", label: "主文字", note: "--text" },
  { key: "textSecondary", label: "次级文字", note: "--text-secondary" },
  { key: "muted", label: "弱文字", note: "--muted" },
  { key: "border", label: "边框", note: "--border" },
  { key: "danger", label: "危险色", note: "--danger" },
  { key: "gridLine", label: "网格线", note: "workspace grid" },
];

function SettingsPanel({
  activeTheme,
  config,
  themeMode,
  themeConfigs,
  onReset,
  onSaveSettings,
  onThemeChange,
  onThemeModeChange,
  onUpdate,
}: SettingsPanelProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  async function copyTheme() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  function saveSettings() {
    onSaveSettings();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className="settingsPage">
      <header className="settingsTitle">
        <span>appearance</span>
        <h2>外观</h2>
      </header>

      <section className="themeOverview">
        <div className="themeOverviewCopy">
          <strong>主题</strong>
          <span>使用当前预设作为基础，直接调整颜色、字号与导航 token。</span>
        </div>

        <div className="modeSwitch" aria-label="Theme mode">
          <button
            type="button"
            data-active={themeMode === "light"}
            onClick={() => onThemeModeChange("light")}
          >
            <Sun size={14} />
            浅色
          </button>
          <button
            type="button"
            data-active={themeMode === "dark"}
            onClick={() => onThemeModeChange("dark")}
          >
            <Moon size={14} />
            深色
          </button>
          <button
            type="button"
            data-active={themeMode === "system"}
            onClick={() => onThemeModeChange("system")}
          >
            <Monitor size={14} />
            系统
          </button>
        </div>

        <div className="codeCompare" aria-label="Theme preview">
          <div className="codePane" data-tone="before">
            <div>
              <span>1</span>
              <code>
                const <b>themePreview</b>: <i>ThemeConfig</i> = {"{"}
              </code>
            </div>
            <div>
              <span>2</span>
              <code>surface: "module-rail",</code>
            </div>
            <div>
              <span>3</span>
              <code>accent: "{defaultThemeConfigs[activeTheme].accent}",</code>
            </div>
            <div>
              <span>4</span>
              <code>contrast: {defaultThemeConfigs[activeTheme].contrast},</code>
            </div>
            <div>
              <span>5</span>
              <code>{"};"}</code>
            </div>
          </div>
          <div className="codePane" data-tone="after">
            <div>
              <span>1</span>
              <code>
                const <b>themePreview</b>: <i>ThemeConfig</i> = {"{"}
              </code>
            </div>
            <div>
              <span>2</span>
              <code>surface: "inspector-panel",</code>
            </div>
            <div>
              <span>3</span>
              <code>accent: "{config.accent}",</code>
            </div>
            <div>
              <span>4</span>
              <code>contrast: {config.contrast},</code>
            </div>
            <div>
              <span>5</span>
              <code>{"};"}</code>
            </div>
          </div>
        </div>
      </section>

      <div className="settingsGrid">
        <section className="settingsCard colorCard">
          <header className="settingsCardHeader">
            <div>
              <h3>颜色配置表</h3>
              <span>
                当前预设：
                {themePresets.find((theme) => theme.id === activeTheme)?.label}
              </span>
            </div>

            <div className="settingsCardActions">
              <ThemePresetDropdown
                activeTheme={activeTheme}
                onThemeChange={onThemeChange}
              />
            <button className="barButton" type="button" onClick={copyTheme}>
              <Copy size={14} />
              <span>{copied ? "copied" : "copy json"}</span>
            </button>
            <button className="barButton saveButton" type="button" onClick={saveSettings}>
              <Save size={14} />
              <span>{saved ? "saved" : "save settings"}</span>
            </button>
            <button className="barButton" type="button" onClick={onReset}>
              <RotateCcw size={14} />
              <span>reset</span>
              </button>
            </div>
          </header>

          <div className="presetStrip">
            {themePresets.map((theme) => (
              <button
                key={theme.id}
                type="button"
                className="presetChip"
                data-active={theme.id === activeTheme}
                onClick={() => onThemeChange(theme.id)}
              >
                <span style={{ background: themeConfigs[theme.id].accent }} />
                {theme.label}
              </button>
            ))}
          </div>

          <div className="settingsTable">
            {colorRows.map((row) => (
              <ColorTokenRow
                key={row.key}
                label={row.label}
                note={row.note}
                value={config[row.key]}
                onChange={(value) => onUpdate({ [row.key]: value })}
              />
            ))}
          </div>
        </section>

        <section className="settingsCard">
          <header className="settingsCardHeader">
            <div>
              <h3>字体与渲染</h3>
              <span>这些值会立即作用在当前 UI3 工作台 shell。</span>
            </div>
            <div className="settingsCardActions">
              <button className="barButton saveButton" type="button" onClick={saveSettings}>
                <Save size={14} />
                <span>{saved ? "saved" : "save settings"}</span>
              </button>
            </div>
          </header>

          <div className="settingsTable">
            <TextTokenRow
              label="UI 字体"
              note="--ui-font"
              value={config.uiFont}
              onChange={(uiFont) => onUpdate({ uiFont })}
            />
            <TextTokenRow
              label="代码字体"
              note="--code-font"
              value={config.codeFont}
              onChange={(codeFont) => onUpdate({ codeFont })}
            />
            <RangeTokenRow
              label="UI 字号"
              note="--ui-font-size"
              max={20}
              min={12}
              unit="px"
              value={config.uiFontSize}
              onChange={(uiFontSize) => onUpdate({ uiFontSize })}
            />
            <RangeTokenRow
              label="代码字号"
              note="--code-font-size"
              max={20}
              min={12}
              unit="px"
              value={config.codeFontSize}
              onChange={(codeFontSize) => onUpdate({ codeFontSize })}
            />
            <div className="settingsRow">
              <div>
                <strong>半透明模块 rail</strong>
                <span>rail alpha</span>
              </div>
              <label className="switchControl">
                <input
                  type="checkbox"
                  checked={config.translucentRail}
                  onChange={(event) =>
                    onUpdate({ translucentRail: event.target.checked })
                  }
                />
                <span />
              </label>
            </div>
            <RangeTokenRow
              label="对比度"
              note="accent intensity"
              max={100}
              min={20}
              value={config.contrast}
              onChange={(contrast) => onUpdate({ contrast })}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

type ThemePresetDropdownProps = {
  activeTheme: ThemePresetId;
  onThemeChange: (theme: ThemePresetId) => void;
};

function ThemePresetDropdown({
  activeTheme,
  onThemeChange,
}: ThemePresetDropdownProps) {
  const [open, setOpen] = useState(false);
  const activePreset =
    themePresets.find((theme) => theme.id === activeTheme) ?? themePresets[0];

  function closeOnExit(event: React.FocusEvent<HTMLDivElement>) {
    const target = event.relatedTarget;

    if (!(target instanceof Node) || !event.currentTarget.contains(target)) {
      setOpen(false);
    }
  }

  return (
    <div className="themePresetSelect" onBlur={closeOnExit}>
      <button
        className="themePresetTrigger"
        type="button"
        aria-label="Theme preset"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((valueToToggle) => !valueToToggle)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{activePreset.label}</span>
        <ChevronDown size={13} />
      </button>

      {open ? (
        <div className="themePresetOptions" role="listbox">
          {themePresets.map((theme) => (
            <button
              key={theme.id}
              type="button"
              role="option"
              aria-selected={theme.id === activeTheme}
              data-active={theme.id === activeTheme}
              onClick={() => {
                onThemeChange(theme.id);
                setOpen(false);
              }}
            >
              {theme.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type ColorTokenRowProps = {
  label: string;
  note: string;
  value: string;
  onChange: (value: string) => void;
};

function ColorTokenRow({ label, note, value, onChange }: ColorTokenRowProps) {
  const safeValue = colorValue(value, "#000000");

  return (
    <div className="settingsRow">
      <div>
        <strong>{label}</strong>
        <span>{note}</span>
      </div>
      <div className="colorControl">
        <input
          type="color"
          value={safeValue}
          aria-label={label}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
        <input
          className="hexInput"
          value={value}
          spellCheck={false}
          onChange={(event) => onChange(event.target.value)}
          onBlur={() => onChange(colorValue(value, safeValue))}
        />
      </div>
    </div>
  );
}

type TextTokenRowProps = {
  label: string;
  note: string;
  value: string;
  onChange: (value: string) => void;
};

function TextTokenRow({ label, note, value, onChange }: TextTokenRowProps) {
  return (
    <div className="settingsRow">
      <div>
        <strong>{label}</strong>
        <span>{note}</span>
      </div>
      <input
        className="textTokenInput"
        value={value}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

type RangeTokenRowProps = {
  label: string;
  max: number;
  min: number;
  note: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
};

function RangeTokenRow({
  label,
  max,
  min,
  note,
  onChange,
  unit = "",
  value,
}: RangeTokenRowProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="settingsRow">
      <div>
        <strong>{label}</strong>
        <span>{note}</span>
      </div>
      <label
        className="rangeControl"
        style={{ "--range-percent": `${percent}%` } as React.CSSProperties}
      >
        <input
          min={min}
          max={max}
          type="range"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <output>
          {value}
          {unit}
        </output>
      </label>
    </div>
  );
}

type AccountControlProps = {
  account: FeishuAccount | null;
  onAuthOpen: () => void;
  onRoleChange: (role: AccountRole) => void;
  onSignOut: () => void;
};

function AccountControl({
  account,
  onAuthOpen,
  onRoleChange,
  onSignOut,
}: AccountControlProps) {
  if (!account) {
    return (
      <button className="barButton" type="button" onClick={onAuthOpen}>
        <LogIn size={14} />
        <span>feishu</span>
      </button>
    );
  }

  return (
    <div className="accountControl">
      <RoleDropdown value={account.role} onChange={onRoleChange} />
      <button className="iconButton" type="button" title="Sign out" onClick={onSignOut}>
        <LogOut size={15} />
      </button>
    </div>
  );
}

type RoleDropdownProps = {
  value: AccountRole;
  onChange: (role: AccountRole) => void;
  variant?: "toolbar" | "field";
};

function RoleDropdown({ value, onChange, variant = "toolbar" }: RoleDropdownProps) {
  const [open, setOpen] = useState(false);
  const activeRole = roles.find((role) => role.id === value) ?? roles[0];

  function closeOnExit(event: React.FocusEvent<HTMLDivElement>) {
    const target = event.relatedTarget;

    if (!(target instanceof Node) || !event.currentTarget.contains(target)) {
      setOpen(false);
    }
  }

  return (
    <div className="roleSelect roleSelectMenu" data-variant={variant} onBlur={closeOnExit}>
      <ShieldCheck size={14} />
      <button
        className="roleSelectTrigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((valueToToggle) => !valueToToggle)}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span>{activeRole.label}</span>
        <ChevronDown size={13} />
      </button>

      {open ? (
        <div className="roleSelectOptions" role="listbox">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              role="option"
              aria-selected={role.id === value}
              data-active={role.id === value}
              onClick={() => {
                onChange(role.id);
                setOpen(false);
              }}
            >
              {role.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type AuthDialogProps = {
  account: FeishuAccount | null;
  onClose: () => void;
  onRoleChange: (role: AccountRole) => void;
  onSignIn: (role: AccountRole) => void;
  onSignOut: () => void;
};

function AuthDialog({
  account,
  onClose,
  onRoleChange,
  onSignIn,
  onSignOut,
}: AuthDialogProps) {
  const [selectedRole, setSelectedRole] = useState<AccountRole>(
    account?.role ?? "designer",
  );
  const feishuOAuthUrl = buildFeishuOAuthUrl();

  function submitSignIn() {
    if (feishuOAuthUrl) {
      window.location.assign(feishuOAuthUrl);
      return;
    }

    onSignIn(selectedRole);
  }

  return (
    <div className="dialogLayer" role="presentation" onMouseDown={onClose}>
      <section
        className="authDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span className="dialogEyebrow">account</span>
            <h2 id="auth-title">Feishu access</h2>
          </div>
          <button className="iconButton" type="button" aria-label="Close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="authRows">
          <div className="fieldBlock">
            <span>role</span>
            <RoleDropdown
              value={account?.role ?? selectedRole}
              variant="field"
              onChange={(nextRole) => {
                setSelectedRole(nextRole);
                if (account) {
                  onRoleChange(nextRole);
                }
              }}
            />
          </div>

          <div className="permissionGrid">
            {toolItems.map((tool) => {
              const checked = canAccessTool(account?.role ?? selectedRole, tool);
              return (
                <div className="permissionRow" key={tool.id} data-enabled={checked}>
                  <span>{tool.shortLabel}</span>
                  {checked ? <ShieldCheck size={14} /> : <Lock size={14} />}
                </div>
              );
            })}
          </div>
        </div>

        <footer>
          {account ? (
            <button className="barButton dangerButton" type="button" onClick={onSignOut}>
              <LogOut size={15} />
              <span>sign out</span>
            </button>
          ) : (
            <button className="primaryButton" type="button" onClick={submitSignIn}>
              <KeyRound size={15} />
              <span>{feishuOAuthUrl ? "continue with feishu" : "use feishu demo"}</span>
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
