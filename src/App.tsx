import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AppWindow,
  Archive,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileText,
  Folder,
  Grid2X2,
  Image as ImageIcon,
  KeyRound,
  Layers3,
  Library,
  List,
  Lock,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Scissors,
  SearchCheck,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  TextCursorInput,
  Type,
  UserRound,
  Workflow,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AccountRole } from "./data/tools";
import { roles } from "./data/tools";
import {
  buildFeishuOAuthUrl,
  consumeFeishuOAuthCallback,
  createDemoFeishuAccount,
  getFeishuOAuthSetup,
  loadFeishuAccount,
  saveFeishuAccount,
} from "./auth/feishu";
import type { FeishuAccount } from "./auth/feishu";
import { DesignProjectsWorkbench } from "./tools/DesignProjectsWorkbench";
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
type AuthStatus = {
  message: string;
  tone: "danger" | "neutral" | "success";
};
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
const NAVIGATION_STORAGE_KEY = "vision-design-platform.navigation-state.ui3.v1";
const DEFAULT_THEME_ID: ThemePresetId = "ghostty-carbon";
const TEAM_ICON_SRC = `${import.meta.env.BASE_URL}team-icon.png`;
const BRAND_GUIDELINE_PDF_SRC = publicAssetHref(
  "brand-assets/viaim-visual-guidelines-260309-internal-draft.pdf",
);
const FIGMA_PROJECT_DASHBOARD_SRC = publicAssetHref(
  "tools/figma-project-dashboard/figma-project-changelog.html",
);

function publicAssetHref(path: string) {
  return `${import.meta.env.BASE_URL}${path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}

const brandGuidelineAsset = {
  id: "viaim-visual-guidelines-260309",
  title: "Viaim 品牌视觉规范",
  version: "260309 Internal Draft",
  status: "latest",
  format: "PDF",
  size: "82 MB",
  owner: "viaim brand",
  updatedAt: "2026-07-05",
  sourceDate: "2026-03-09",
  href: BRAND_GUIDELINE_PDF_SRC,
  summary:
    "最新品牌视觉规范。支持在线预览和下载，后续版本会继续追加到版本更新历史。",
};

const brandGuidelineVersions = [
  {
    version: "260309 Internal Draft",
    date: "2026-07-05",
    status: "current",
    note: "新增到公开品牌资料库，作为当前最新品牌视觉规范。",
    href: BRAND_GUIDELINE_PDF_SRC,
  },
];

type LogoViewMode = "grid" | "list";

type BrandLogoFormat = {
  label: "SVG" | "PNG" | "PDF";
  href: string;
  fileName: string;
  size: string;
};

type BrandLogoAsset = {
  id: string;
  title: string;
  context: string;
  usage: string;
  dimensions: string;
  previewHref: string;
  formats: BrandLogoFormat[];
};

type BrandFontAsset = {
  id: string;
  label: string;
  weight: number;
  fileName: string;
  href: string;
  size: string;
  role: string;
};

const brandLogoAssets: BrandLogoAsset[] = [
  {
    id: "brand-color",
    title: "viaim logo BrandColor",
    context: "brand color",
    usage: "Primary logo for neutral and light surfaces.",
    dimensions: "4710 x 1280 px",
    previewHref: publicAssetHref("brand-assets/logos/viaim logo BrandColor.svg"),
    formats: [
      {
        label: "SVG",
        href: publicAssetHref("brand-assets/logos/viaim logo BrandColor.svg"),
        fileName: "viaim logo BrandColor.svg",
        size: "3.8 KB",
      },
      {
        label: "PNG",
        href: publicAssetHref("brand-assets/logos/viaim logo BrandColor.png"),
        fileName: "viaim logo BrandColor.png",
        size: "79 KB",
      },
      {
        label: "PDF",
        href: publicAssetHref("brand-assets/logos/viaim logo BrandColor.pdf"),
        fileName: "viaim logo BrandColor.pdf",
        size: "7.2 KB",
      },
    ],
  },
  {
    id: "on-light",
    title: "viaim logo onLight",
    context: "on light",
    usage: "Logo variant prepared for light backgrounds.",
    dimensions: "4710 x 1280 px",
    previewHref: publicAssetHref("brand-assets/logos/viaim logo onLight.svg"),
    formats: [
      {
        label: "SVG",
        href: publicAssetHref("brand-assets/logos/viaim logo onLight.svg"),
        fileName: "viaim logo onLight.svg",
        size: "3.8 KB",
      },
      {
        label: "PNG",
        href: publicAssetHref("brand-assets/logos/viaim logo onLight.png"),
        fileName: "viaim logo onLight.png",
        size: "68 KB",
      },
      {
        label: "PDF",
        href: publicAssetHref("brand-assets/logos/viaim logo onLight.pdf"),
        fileName: "viaim logo onLight.pdf",
        size: "7.1 KB",
      },
    ],
  },
  {
    id: "on-dark",
    title: "viaim logo onDark",
    context: "on dark",
    usage: "Logo variant prepared for dark backgrounds.",
    dimensions: "4710 x 1280 px",
    previewHref: publicAssetHref("brand-assets/logos/viaim logo onDark.svg"),
    formats: [
      {
        label: "SVG",
        href: publicAssetHref("brand-assets/logos/viaim logo onDark.svg"),
        fileName: "viaim logo onDark.svg",
        size: "3.8 KB",
      },
      {
        label: "PNG",
        href: publicAssetHref("brand-assets/logos/viaim logo onDark.png"),
        fileName: "viaim logo onDark.png",
        size: "73 KB",
      },
      {
        label: "PDF",
        href: publicAssetHref("brand-assets/logos/viaim logo onDark.pdf"),
        fileName: "viaim logo onDark.pdf",
        size: "7.1 KB",
      },
    ],
  },
];

const brandFontAssets: BrandFontAsset[] = [
  {
    id: "misans-thin",
    label: "MiSans Thin",
    weight: 100,
    fileName: "MiSans-Thin.otf",
    href: publicAssetHref("brand-assets/fonts/misans/MiSans-Thin.otf"),
    size: "6.4 MB",
    role: "Hairline display",
  },
  {
    id: "misans-extralight",
    label: "MiSans ExtraLight",
    weight: 200,
    fileName: "MiSans-ExtraLight.otf",
    href: publicAssetHref("brand-assets/fonts/misans/MiSans-ExtraLight.otf"),
    size: "6.4 MB",
    role: "Light display",
  },
  {
    id: "misans-light",
    label: "MiSans Light",
    weight: 300,
    fileName: "MiSans-Light.otf",
    href: publicAssetHref("brand-assets/fonts/misans/MiSans-Light.otf"),
    size: "6.3 MB",
    role: "Soft body",
  },
  {
    id: "misans-normal",
    label: "MiSans Normal",
    weight: 350,
    fileName: "MiSans-Normal.otf",
    href: publicAssetHref("brand-assets/fonts/misans/MiSans-Normal.otf"),
    size: "6.3 MB",
    role: "Neutral body",
  },
  {
    id: "misans-regular",
    label: "MiSans Regular",
    weight: 400,
    fileName: "MiSans-Regular.otf",
    href: publicAssetHref("brand-assets/fonts/misans/MiSans-Regular.otf"),
    size: "6.2 MB",
    role: "Default body",
  },
  {
    id: "misans-medium",
    label: "MiSans Medium",
    weight: 500,
    fileName: "MiSans-Medium.otf",
    href: publicAssetHref("brand-assets/fonts/misans/MiSans-Medium.otf"),
    size: "6.2 MB",
    role: "UI emphasis",
  },
  {
    id: "misans-demibold",
    label: "MiSans Demibold",
    weight: 600,
    fileName: "MiSans-Demibold.otf",
    href: publicAssetHref("brand-assets/fonts/misans/MiSans-Demibold.otf"),
    size: "6.2 MB",
    role: "Section titles",
  },
  {
    id: "misans-semibold",
    label: "MiSans Semibold",
    weight: 650,
    fileName: "MiSans-Semibold.otf",
    href: publicAssetHref("brand-assets/fonts/misans/MiSans-Semibold.otf"),
    size: "6.2 MB",
    role: "Strong emphasis",
  },
  {
    id: "misans-bold",
    label: "MiSans Bold",
    weight: 700,
    fileName: "MiSans-Bold.otf",
    href: publicAssetHref("brand-assets/fonts/misans/MiSans-Bold.otf"),
    size: "6.3 MB",
    role: "Headline",
  },
  {
    id: "misans-heavy",
    label: "MiSans Heavy",
    weight: 900,
    fileName: "MiSans-Heavy.otf",
    href: publicAssetHref("brand-assets/fonts/misans/MiSans-Heavy.otf"),
    size: "6.3 MB",
    role: "Hero weight",
  },
];

const defaultFontPreviewText =
  "viaim 品牌资产 / We Aim to Explore. / 让灵感、记录和知识更自然地流动。";

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

type L1DomainId =
  | "brand-assets"
  | "toolbox"
  | "open-design"
  | "figma-projects"
  | "skill-platform"
  | "design-daily"
  | "system";

type RouteSurface =
  | "resource-library"
  | "slice-tool"
  | "open-design-workspace"
  | "ai-create"
  | "integration"
  | "design-projects"
  | "figma-project-dashboard"
  | "member-management"
  | "skill-library"
  | "skill-tuning"
  | "resource-extraction"
  | "daily-browse"
  | "daily-manage"
  | "account-permission"
  | "appearance-settings"
  | "future-lab";

type PackageKind =
  | "tool"
  | "integration"
  | "library"
  | "project"
  | "automation"
  | "settings";

type InspectorSection =
  | "selection"
  | "account"
  | "properties"
  | "tokens"
  | "status"
  | "logs";

type L3Package = {
  id: string;
  label: string;
  note: string;
  kind: PackageKind;
  icon: LucideIcon;
  minimumRole?: AccountRole;
};

type WorkspaceRoute = {
  id: string;
  l1Id: L1DomainId;
  l2Id: string;
  l2Label: string;
  l2Note: string;
  defaultL3Id: string;
  minimumRole: AccountRole;
  status: string;
  queue: string;
  quality: string;
  workbenchLabel: string;
  workbenchDescription: string;
  surface: RouteSurface;
  l3Packages: L3Package[];
  inspectorSections: InspectorSection[];
};

const primaryDomains: Array<{
  id: L1DomainId;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "brand-assets", label: "viaim 品牌资产", icon: Library },
  { id: "toolbox", label: "工具箱", icon: Workflow },
  { id: "open-design", label: "OpenDesign", icon: Sparkles },
  { id: "figma-projects", label: "设计项目", icon: Layers3 },
  { id: "skill-platform", label: "Skill 平台", icon: KeyRound },
  { id: "design-daily", label: "设计日报", icon: BarChart3 },
  { id: "system", label: "系统设置", icon: ShieldCheck },
];

const workspaceRoutes: WorkspaceRoute[] = [
  {
    id: "brand-assets.public-library",
    l1Id: "brand-assets",
    l2Id: "public-library",
    l2Label: "公开资料库",
    l2Note: "assets / preview / download",
    defaultL3Id: "brand-guidelines",
    minimumRole: "viewer",
    status: "public",
    queue: "download",
    quality: "open",
    workbenchLabel: "资源预览",
    workbenchDescription:
      "对所有权限开放的 viaim 品牌资料、产品资料、字体包、公开界面和品牌 skill。当前先保留为空白资源台，后续接入 PDF、PNG、SVG 和下载列表。",
    surface: "resource-library",
    inspectorSections: ["selection", "account", "properties", "tokens", "status"],
    l3Packages: [
      {
        id: "brand-guidelines",
        label: "品牌规范",
        note: "pdf / rules / voice",
        kind: "library",
        icon: Library,
      },
      {
        id: "visual-assets",
        label: "视觉资产",
        note: "png / svg / preview",
        kind: "library",
        icon: Palette,
      },
      {
        id: "product-assets",
        label: "产品素材",
        note: "renders / documents",
        kind: "library",
        icon: Database,
      },
      {
        id: "font-packages",
        label: "字体包",
        note: "fonts / licenses",
        kind: "library",
        icon: KeyRound,
      },
      {
        id: "product-ui",
        label: "产品界面",
        note: "screens / public ui",
        kind: "library",
        icon: AppWindow,
      },
      {
        id: "brand-skills",
        label: "品牌 skill",
        note: "skill files",
        kind: "library",
        icon: Sparkles,
      },
    ],
  },
  {
    id: "toolbox.image-tools",
    l1Id: "toolbox",
    l2Id: "image-tools",
    l2Label: "图片工具",
    l2Note: "import / slice / export",
    defaultL3Id: "slice-adjust",
    minimumRole: "viewer",
    status: "local",
    queue: "image slices",
    quality: "ready",
    workbenchLabel: "切图调整",
    workbenchDescription: "本地图片导入、切图参数、生成预览和结果下载。",
    surface: "slice-tool",
    inspectorSections: ["selection", "account", "properties", "status", "logs"],
    l3Packages: [
      {
        id: "slice-adjust",
        label: "切图调整",
        note: "import / preview / zip",
        kind: "tool",
        icon: Scissors,
      },
    ],
  },
  {
    id: "open-design.workspace",
    l1Id: "open-design",
    l2Id: "workspace",
    l2Label: "工作台",
    l2Note: "projects / runs / agents",
    defaultL3Id: "projects",
    minimumRole: "designer",
    status: "stub",
    queue: "runtime",
    quality: "draft",
    workbenchLabel: "OpenDesign 项目与运行",
    workbenchDescription:
      "OpenDesign 是开放的复杂一级域，后续承载项目、运行记录、agent、模板和设计系统能力。",
    surface: "open-design-workspace",
    inspectorSections: ["selection", "account", "properties", "status", "logs"],
    l3Packages: [
      {
        id: "projects",
        label: "Projects",
        note: "repos / spaces",
        kind: "project",
        icon: Folder,
      },
      {
        id: "runs",
        label: "Runs",
        note: "jobs / history",
        kind: "automation",
        icon: Activity,
      },
      {
        id: "agents",
        label: "Agents",
        note: "codex / claude",
        kind: "automation",
        icon: Workflow,
      },
      {
        id: "templates",
        label: "Templates",
        note: "patterns / kits",
        kind: "library",
        icon: Library,
      },
    ],
  },
  {
    id: "open-design.ai-create",
    l1Id: "open-design",
    l2Id: "ai-create",
    l2Label: "AI 创作",
    l2Note: "generate / reverse prompt",
    defaultL3Id: "image-generate",
    minimumRole: "designer",
    status: "planned",
    queue: "models",
    quality: "draft",
    workbenchLabel: "AI 图片生成与拆解",
    workbenchDescription:
      "AI 生图、图片生成反向提示词和结构化拆分暂时归入 OpenDesign，后续与生成、agent、模板和设计上下文耦合。",
    surface: "ai-create",
    inspectorSections: ["selection", "account", "properties", "status", "logs"],
    l3Packages: [
      {
        id: "image-generate",
        label: "AI 生图",
        note: "prompt / render",
        kind: "tool",
        icon: Sparkles,
      },
      {
        id: "reverse-prompt",
        label: "反向提示词",
        note: "image to prompt",
        kind: "tool",
        icon: SearchCheck,
      },
      {
        id: "structure-breakdown",
        label: "结构化拆分",
        note: "layers / tokens",
        kind: "tool",
        icon: Layers3,
      },
    ],
  },
  {
    id: "open-design.integrations",
    l1Id: "open-design",
    l2Id: "integrations",
    l2Label: "集成",
    l2Note: "github / runtime / export",
    defaultL3Id: "github-repo",
    minimumRole: "owner",
    status: "restricted",
    queue: "risk",
    quality: "owner",
    workbenchLabel: "OpenDesign 集成配置",
    workbenchDescription:
      "管理 GitHub 仓库、本地 runtime 和导出链路。这里涉及外部系统和风险操作，最低权限为 owner。",
    surface: "integration",
    inspectorSections: ["selection", "account", "properties", "status", "logs"],
    l3Packages: [
      {
        id: "github-repo",
        label: "GitHub Repo",
        note: "repo / branches",
        kind: "integration",
        icon: Database,
        minimumRole: "owner",
      },
      {
        id: "local-runtime",
        label: "Local Runtime",
        note: "daemon / agents",
        kind: "integration",
        icon: Monitor,
        minimumRole: "owner",
      },
      {
        id: "export",
        label: "Export",
        note: "build / publish",
        kind: "integration",
        icon: Archive,
        minimumRole: "owner",
      },
    ],
  },
  {
    id: "figma-projects.design-projects",
    l1Id: "figma-projects",
    l2Id: "design-projects",
    l2Label: "设计项目",
    l2Note: "feishu base / tasks",
    defaultL3Id: "task-entries",
    minimumRole: "designer",
    status: "synced",
    queue: "feishu base",
    quality: "read only",
    workbenchLabel: "设计项目需求提报",
    workbenchDescription:
      "从飞书 Base「设计项目需求提报」单向同步的任务条目，只读展示列表、筛选、搜索和详情。",
    surface: "design-projects",
    inspectorSections: ["selection", "account", "properties", "status", "logs"],
    l3Packages: [
      {
        id: "task-entries",
        label: "任务条目",
        note: "list / filter / detail",
        kind: "project",
        icon: List,
      },
    ],
  },
  {
    id: "figma-projects.design-file-management",
    l1Id: "figma-projects",
    l2Id: "design-file-management",
    l2Label: "Figma 项目",
    l2Note: "map / changelog",
    defaultL3Id: "page-map",
    minimumRole: "designer",
    status: "integrated",
    queue: "figma dashboard",
    quality: "live",
    workbenchLabel: "Figma 设计文件管理",
    workbenchDescription:
      "从 Figma Project Dashboard 导入的项目级文件管理工作台，保留项目导入、Page Map、版本变更和页面分析能力。",
    surface: "figma-project-dashboard",
    inspectorSections: ["selection", "account", "properties", "status", "logs"],
    l3Packages: [
      {
        id: "page-map",
        label: "Map",
        note: "projects / files / pages",
        kind: "project",
        icon: Grid2X2,
      },
      {
        id: "changelog",
        label: "Changelog",
        note: "versions / diff",
        kind: "project",
        icon: Archive,
      },
    ],
  },
  {
    id: "figma-projects.member-management",
    l1Id: "figma-projects",
    l2Id: "member-management",
    l2Label: "成员管理",
    l2Note: "members / roles / spaces",
    defaultL3Id: "members",
    minimumRole: "owner",
    status: "restricted",
    queue: "accounts",
    quality: "owner",
    workbenchLabel: "Figma 成员与权限",
    workbenchDescription:
      "用于承载成员表、角色分配、空间管理和文件权限核查。管理型操作需要 owner。",
    surface: "member-management",
    inspectorSections: ["selection", "account", "properties", "status", "logs"],
    l3Packages: [
      {
        id: "members",
        label: "成员",
        note: "people / teams",
        kind: "project",
        icon: UserRound,
        minimumRole: "owner",
      },
      {
        id: "roles",
        label: "角色",
        note: "owner / designer / viewer",
        kind: "settings",
        icon: ShieldCheck,
        minimumRole: "owner",
      },
      {
        id: "spaces",
        label: "空间",
        note: "teams / projects",
        kind: "project",
        icon: Folder,
        minimumRole: "owner",
      },
      {
        id: "file-permissions",
        label: "文件权限",
        note: "access / audit",
        kind: "settings",
        icon: Lock,
        minimumRole: "owner",
      },
    ],
  },
  {
    id: "skill-platform.library",
    l1Id: "skill-platform",
    l2Id: "library",
    l2Label: "skill 文件库",
    l2Note: "brand / product / external",
    defaultL3Id: "brand-skill-library",
    minimumRole: "viewer",
    status: "library",
    queue: "skills",
    quality: "open",
    workbenchLabel: "Skill 文件浏览",
    workbenchDescription:
      "管理品牌 skill、产品设计 skill、外部 skill 和内部 skill 的来源、版本和适用范围。",
    surface: "skill-library",
    inspectorSections: ["selection", "account", "properties", "tokens", "status"],
    l3Packages: [
      {
        id: "brand-skill-library",
        label: "品牌 skill",
        note: "brand rules",
        kind: "library",
        icon: Sparkles,
      },
      {
        id: "product-design-skill",
        label: "产品设计 skill",
        note: "design workflows",
        kind: "library",
        icon: Layers3,
      },
      {
        id: "external-skill",
        label: "外部 skill",
        note: "public sources",
        kind: "library",
        icon: Archive,
      },
      {
        id: "internal-skill",
        label: "内部 skill",
        note: "private sources",
        kind: "library",
        icon: Lock,
      },
    ],
  },
  {
    id: "skill-platform.tuning",
    l1Id: "skill-platform",
    l2Id: "tuning",
    l2Label: "文件管理与调优",
    l2Note: "edit / test / validate",
    defaultL3Id: "product-skill-tuning",
    minimumRole: "designer",
    status: "draft",
    queue: "validation",
    quality: "designer",
    workbenchLabel: "Skill 调优工作台",
    workbenchDescription:
      "用于 skill 编辑、Prompt 模板、调优测试和评估记录，产物进入草稿或待发布状态。",
    surface: "skill-tuning",
    inspectorSections: ["selection", "account", "properties", "status", "logs"],
    l3Packages: [
      {
        id: "product-skill-tuning",
        label: "产品设计 skill 调优",
        note: "rules / examples",
        kind: "tool",
        icon: SlidersHorizontal,
      },
      {
        id: "prompt-templates",
        label: "Prompt 模板",
        note: "templates / snippets",
        kind: "library",
        icon: Library,
      },
      {
        id: "evaluation-records",
        label: "评估记录",
        note: "scores / diffs",
        kind: "project",
        icon: BarChart3,
      },
    ],
  },
  {
    id: "skill-platform.resource-extraction",
    l1Id: "skill-platform",
    l2Id: "resource-extraction",
    l2Label: "资源提取",
    l2Note: "internal / external / queue",
    defaultL3Id: "internal-resources",
    minimumRole: "designer",
    status: "queue",
    queue: "imports",
    quality: "draft",
    workbenchLabel: "Skill 资源提取",
    workbenchDescription:
      "承载内部和外部资源提取、清洗、结构化入库与导入队列。",
    surface: "resource-extraction",
    inspectorSections: ["selection", "account", "properties", "status", "logs"],
    l3Packages: [
      {
        id: "internal-resources",
        label: "内部资源",
        note: "local / private",
        kind: "library",
        icon: Lock,
      },
      {
        id: "external-resources",
        label: "外部资源",
        note: "public / web",
        kind: "library",
        icon: Archive,
      },
      {
        id: "import-queue",
        label: "导入队列",
        note: "clean / validate",
        kind: "automation",
        icon: Workflow,
      },
    ],
  },
  {
    id: "design-daily.browse",
    l1Id: "design-daily",
    l2Id: "browse",
    l2Label: "日报查阅",
    l2Note: "latest / archive / topics",
    defaultL3Id: "latest-daily",
    minimumRole: "viewer",
    status: "read",
    queue: "daily",
    quality: "open",
    workbenchLabel: "设计日报阅读",
    workbenchDescription:
      "用于日报阅读、筛选、搜索、收藏和来源索引。当前先保留为空白阅读台。",
    surface: "daily-browse",
    inspectorSections: ["selection", "account", "properties", "status"],
    l3Packages: [
      {
        id: "latest-daily",
        label: "最新日报",
        note: "today / week",
        kind: "library",
        icon: BarChart3,
      },
      {
        id: "archive",
        label: "历史归档",
        note: "calendar / history",
        kind: "library",
        icon: Archive,
      },
      {
        id: "topics",
        label: "专题",
        note: "collections",
        kind: "library",
        icon: Library,
      },
      {
        id: "source-index",
        label: "来源索引",
        note: "feeds / refs",
        kind: "library",
        icon: SearchCheck,
      },
    ],
  },
  {
    id: "design-daily.manage",
    l1Id: "design-daily",
    l2Id: "manage",
    l2Label: "日报管理",
    l2Note: "publish / draft / sources",
    defaultL3Id: "publish-queue",
    minimumRole: "owner",
    status: "restricted",
    queue: "publish",
    quality: "owner",
    workbenchLabel: "日报发布与来源管理",
    workbenchDescription:
      "承载发布队列、草稿和来源配置。发布、归档和来源配置需要 owner。",
    surface: "daily-manage",
    inspectorSections: ["selection", "account", "properties", "status", "logs"],
    l3Packages: [
      {
        id: "publish-queue",
        label: "发布队列",
        note: "send / verify",
        kind: "automation",
        icon: Workflow,
        minimumRole: "owner",
      },
      {
        id: "drafts",
        label: "草稿",
        note: "edit / review",
        kind: "project",
        icon: Archive,
        minimumRole: "owner",
      },
      {
        id: "source-config",
        label: "来源配置",
        note: "feeds / rules",
        kind: "settings",
        icon: SlidersHorizontal,
        minimumRole: "owner",
      },
    ],
  },
  {
    id: "system.account-permission",
    l1Id: "system",
    l2Id: "account-permission",
    l2Label: "账号与权限",
    l2Note: "members / roles / audit",
    defaultL3Id: "system-members",
    minimumRole: "owner",
    status: "restricted",
    queue: "accounts",
    quality: "owner",
    workbenchLabel: "权限配置",
    workbenchDescription: "成员、角色、授权和审计都属于 owner 级系统操作。",
    surface: "account-permission",
    inspectorSections: ["selection", "account", "properties", "status", "logs"],
    l3Packages: [
      {
        id: "system-members",
        label: "成员",
        note: "people",
        kind: "settings",
        icon: UserRound,
        minimumRole: "owner",
      },
      {
        id: "system-roles",
        label: "角色",
        note: "owner / designer / viewer",
        kind: "settings",
        icon: ShieldCheck,
        minimumRole: "owner",
      },
      {
        id: "authorizations",
        label: "授权",
        note: "apps / scopes",
        kind: "settings",
        icon: KeyRound,
        minimumRole: "owner",
      },
      {
        id: "audit",
        label: "审计",
        note: "logs",
        kind: "settings",
        icon: Archive,
        minimumRole: "owner",
      },
    ],
  },
  {
    id: "system.appearance",
    l1Id: "system",
    l2Id: "appearance",
    l2Label: "外观与 token",
    l2Note: "theme / type / color / layout",
    defaultL3Id: "theme",
    minimumRole: "designer",
    status: "tokens",
    queue: "config table",
    quality: "live",
    workbenchLabel: "主题配置",
    workbenchDescription: "颜色、字体、字号、导航状态和渲染 token。",
    surface: "appearance-settings",
    inspectorSections: ["selection", "account", "tokens", "status"],
    l3Packages: [
      {
        id: "theme",
        label: "主题",
        note: "light / dark / system",
        kind: "settings",
        icon: Palette,
      },
      {
        id: "font-size",
        label: "字号",
        note: "ui / code",
        kind: "settings",
        icon: SlidersHorizontal,
      },
      {
        id: "colors",
        label: "颜色",
        note: "tokens / presets",
        kind: "settings",
        icon: Database,
      },
      {
        id: "layout-token",
        label: "布局 token",
        note: "rail / radius / stroke",
        kind: "settings",
        icon: Layers3,
      },
    ],
  },
  {
    id: "system.future-lab",
    l1Id: "system",
    l2Id: "future-lab",
    l2Label: "扩展预留",
    l2Note: "future tools / backlog",
    defaultL3Id: "unclassified-tools",
    minimumRole: "owner",
    status: "planned",
    queue: "backlog",
    quality: "owner",
    workbenchLabel: "未成熟工具登记",
    workbenchDescription:
      "未来大量扩展工具先进入这里登记、评估风险和归属，再迁移到稳定的一级域。",
    surface: "future-lab",
    inspectorSections: ["selection", "account", "properties", "status", "logs"],
    l3Packages: [
      {
        id: "unclassified-tools",
        label: "待归类工具",
        note: "intake / triage",
        kind: "tool",
        icon: Folder,
        minimumRole: "owner",
      },
      {
        id: "experiments",
        label: "实验功能",
        note: "labs",
        kind: "tool",
        icon: Sparkles,
        minimumRole: "owner",
      },
      {
        id: "backlog",
        label: "Backlog",
        note: "ideas / decisions",
        kind: "project",
        icon: Archive,
        minimumRole: "owner",
      },
    ],
  },
];

const roleWeight: Record<AccountRole, number> = {
  viewer: 1,
  designer: 2,
  owner: 3,
};

function canAccessRole(role: AccountRole | null, minimumRole: AccountRole) {
  if (minimumRole === "viewer") {
    return true;
  }

  if (!role) {
    return false;
  }

  return roleWeight[role] >= roleWeight[minimumRole];
}

function getFirstRouteForDomain(domainId: L1DomainId) {
  return (
    workspaceRoutes.find((route) => route.l1Id === domainId) ??
    workspaceRoutes[0]
  );
}

function getRouteById(routeId: string) {
  return (
    workspaceRoutes.find((route) => route.id === routeId) ?? workspaceRoutes[0]
  );
}

function getActivePackage(route: WorkspaceRoute, packageId?: string) {
  return (
    route.l3Packages.find((item) => item.id === packageId) ??
    route.l3Packages.find((item) => item.id === route.defaultL3Id) ??
    route.l3Packages[0]
  );
}

type WorkspaceNavigationState = {
  activeRouteId: string;
  activePackageByRoute: Record<string, string>;
};

function getDefaultNavigationState(): WorkspaceNavigationState {
  return {
    activeRouteId: workspaceRoutes[0].id,
    activePackageByRoute: {},
  };
}

function isRouteId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    workspaceRoutes.some((route) => route.id === value)
  );
}

function isPackageIdForRoute(routeId: string, packageId: unknown): packageId is string {
  const route = workspaceRoutes.find((item) => item.id === routeId);

  return (
    typeof packageId === "string" &&
    Boolean(route?.l3Packages.some((item) => item.id === packageId))
  );
}

function loadNavigationState(): WorkspaceNavigationState {
  const fallbackState = getDefaultNavigationState();
  const raw = window.localStorage.getItem(NAVIGATION_STORAGE_KEY);

  if (!raw) {
    return fallbackState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceNavigationState>;
    const activeRouteId = isRouteId(parsed.activeRouteId)
      ? parsed.activeRouteId
      : fallbackState.activeRouteId;
    const activePackageByRoute: Record<string, string> = {};

    if (
      parsed.activePackageByRoute &&
      typeof parsed.activePackageByRoute === "object" &&
      !Array.isArray(parsed.activePackageByRoute)
    ) {
      Object.entries(parsed.activePackageByRoute).forEach(([routeId, packageId]) => {
        if (isRouteId(routeId) && isPackageIdForRoute(routeId, packageId)) {
          activePackageByRoute[routeId] = packageId;
        }
      });
    }

    return {
      activeRouteId,
      activePackageByRoute,
    };
  } catch {
    window.localStorage.removeItem(NAVIGATION_STORAGE_KEY);
    return fallbackState;
  }
}

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
  const [navigationState, setNavigationState] =
    useState<WorkspaceNavigationState>(() => loadNavigationState());
  const { activeRouteId, activePackageByRoute } = navigationState;
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
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);

  useEffect(() => {
    saveFeishuAccount(account);
  }, [account]);

  useEffect(() => {
    let cancelled = false;

    consumeFeishuOAuthCallback()
      .then((result) => {
        if (cancelled || result.status === "none") {
          return;
        }

        if (result.status === "success") {
          setAccount(result.account);
          setAuthStatus({ message: result.message, tone: "success" });
          setAuthOpen(false);
          return;
        }

        setAuthStatus({ message: result.message, tone: "danger" });
        setAuthOpen(true);
      })
      .catch((caughtError: unknown) => {
        if (cancelled) {
          return;
        }

        setAuthStatus({
          message:
            caughtError instanceof Error
              ? caughtError.message
              : "Feishu OAuth callback failed.",
          tone: "danger",
        });
        setAuthOpen(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeConfigs));
  }, [themeConfigs]);

  useEffect(() => {
    window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
  }, [themeMode]);

  useEffect(() => {
    window.localStorage.setItem(
      NAVIGATION_STORAGE_KEY,
      JSON.stringify(navigationState),
    );
  }, [navigationState]);

  const activeRoute = useMemo(() => getRouteById(activeRouteId), [activeRouteId]);
  const activeDomain = activeRoute.l1Id;
  const activeDomainConfig =
    primaryDomains.find((domain) => domain.id === activeDomain) ??
    primaryDomains[0];
  const activeRoutesForDomain = workspaceRoutes.filter(
    (route) => route.l1Id === activeDomain,
  );
  const activePackage = getActivePackage(
    activeRoute,
    activePackageByRoute[activeRoute.id],
  );
  const role = account?.role ?? null;
  const activeRouteAllowed = canAccessRole(role, activeRoute.minimumRole);
  const activePackageAllowed = canAccessRole(
    role,
    activePackage.minimumRole ?? activeRoute.minimumRole,
  );
  const activeAllowed = activeRouteAllowed && activePackageAllowed;
  const activeThemeConfig = themeConfigs[accentTheme];
  const themeTone = getThemeTone(activeThemeConfig, themeMode);
  const themeStyle = useMemo(
    () => makeThemeStyle(activeThemeConfig),
    [activeThemeConfig],
  );

  function signIn(roleToUse: AccountRole) {
    setAccount(createDemoFeishuAccount(roleToUse));
    setAuthStatus({ message: "Using local Feishu demo account.", tone: "neutral" });
    setAuthOpen(false);
  }

  function signOut() {
    setAccount(null);
    setAuthStatus(null);
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

  function changeDomain(domainId: L1DomainId) {
    const nextRoute = getFirstRouteForDomain(domainId);
    setNavigationState((previous) => ({
      ...previous,
      activeRouteId: nextRoute.id,
    }));
  }

  function changeRoute(routeId: string) {
    if (!isRouteId(routeId)) {
      return;
    }

    setNavigationState((previous) => ({
      ...previous,
      activeRouteId: routeId,
    }));
  }

  function changePackage(packageId: string) {
    if (!isPackageIdForRoute(activeRoute.id, packageId)) {
      return;
    }

    setNavigationState((previous) => ({
      ...previous,
      activePackageByRoute: {
        ...previous.activePackageByRoute,
        [activeRoute.id]: packageId,
      },
    }));
  }

  function renderCanvas() {
    if (!activeAllowed) {
      return (
        <button className="lockedPanel" type="button" onClick={() => setAuthOpen(true)}>
          <Lock size={16} />
          <span>{account ? "permission required" : "feishu login required"}</span>
        </button>
      );
    }

    if (activeRoute.surface === "resource-library") {
      return <BrandResourceWorkbench activePackage={activePackage} />;
    }

    if (activeRoute.surface === "appearance-settings") {
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

    if (activeRoute.surface === "slice-tool") {
      return <SliceTool />;
    }

    if (activeRoute.surface === "figma-project-dashboard") {
      return (
        <FigmaProjectDashboardWorkbench
          activePackage={activePackage}
          config={activeThemeConfig}
        />
      );
    }

    if (activeRoute.surface === "design-projects") {
      return <DesignProjectsWorkbench />;
    }

    return <RoutePlaceholder route={activeRoute} activePackage={activePackage} />;
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
            <img src={TEAM_ICON_SRC} alt="" />
          </span>
          <span className="workspaceMenu workspaceMenuStatic" aria-label="Current space">
            <span>vision design</span>
          </span>
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
                onClick={() => changeDomain(domain.id)}
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
          <strong>{activeRoute.l2Label}</strong>
        </div>

        <nav className="l2Tabs" aria-label="Secondary views">
          {activeRoutesForDomain.map((route) => {
            const domainIcon = activeDomainConfig.icon;
            const allowed = canAccessRole(role, route.minimumRole);

            return (
              <button
                key={route.id}
                className="l2Tab"
                type="button"
                data-active={route.id === activeRoute.id}
                data-disabled={!allowed}
                onClick={() => changeRoute(route.id)}
              >
                {(() => {
                  const Icon = domainIcon;
                  return <Icon size={14} />;
                })()}
                <span>{route.l2Label}</span>
                {!allowed ? <Lock className="tabLock" size={11} /> : null}
              </button>
            );
          })}
        </nav>

        <div className="l2Meta">
          <span className="stateChip" data-state="selected">
            {activeRoute.status}
          </span>
          <span className="stateChip" data-state="neutral">
            {roleLabel(role)}
          </span>
        </div>
      </header>

      <main className="l3Workspace">
        <aside className="moduleRail" aria-label="Functional modules">
          <header className="railHeader">
            <span>L3 packages</span>
            <strong>{activeRoute.l2Label}</strong>
          </header>

          <nav className="moduleList">
            {activeRoute.l3Packages.map((item) => {
              const Icon = item.icon;
              const allowed = canAccessRole(
                role,
                item.minimumRole ?? activeRoute.minimumRole,
              );

              return (
                <button
                  key={item.id}
                  className="moduleButton"
                  type="button"
                  data-active={item.id === activePackage.id}
                  data-disabled={!allowed}
                  onClick={() => changePackage(item.id)}
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

        <section className="moduleCanvas" aria-label={`${activeRoute.workbenchLabel} workspace`}>
          <header className="canvasHeader">
            <div>
              <span>{activePackage.label}</span>
              <h1>{activeRoute.workbenchLabel}</h1>
            </div>
            <div className="canvasActions">
              <span className="stateChip" data-state="success">
                <CheckCircle2 size={12} />
                {activeRoute.quality}
              </span>
              <span className="stateChip" data-state="neutral">
                {activeRoute.queue}
              </span>
            </div>
          </header>
          <div
            className={`canvasBody canvasBody-${activeRoute.surface}`}
            data-locked={!activeAllowed}
          >
            {renderCanvas()}
          </div>
        </section>

        <RouteInspectorPanel
          account={account}
          activeTheme={accentTheme}
          activePackage={activePackage}
          activeRoute={activeRoute}
          config={activeThemeConfig}
          role={role}
          themeMode={themeMode}
          onAuthOpen={() => setAuthOpen(true)}
        />
      </main>

      {authOpen ? (
        <AuthDialog
          account={account}
          authStatus={authStatus}
          onClose={() => setAuthOpen(false)}
          onRoleChange={changeRole}
          onSignIn={signIn}
          onSignOut={signOut}
        />
      ) : null}
    </div>
  );
}

type RoutePlaceholderProps = {
  route: WorkspaceRoute;
  activePackage: L3Package;
};

function RoutePlaceholder({ route, activePackage }: RoutePlaceholderProps) {
  const rows = [
    ["l1", primaryDomains.find((domain) => domain.id === route.l1Id)?.label ?? route.l1Id],
    ["l2", route.l2Label],
    ["l3", activePackage.label],
    ["surface", route.surface],
    ["permission", activePackage.minimumRole ?? route.minimumRole],
    ["status", route.status],
  ];

  return (
    <div className="emptyWorkbench">
      <section className="emptyModulePanel">
        <div>
          <span className="sectionKicker">{activePackage.kind} package</span>
          <h2>{activePackage.label}</h2>
          <p>{route.workbenchDescription}</p>
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
        {route.l3Packages.map((item, index) => (
          <div
            className="previewCell"
            key={item.id}
            data-active={item.id === activePackage.id}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item.label}</strong>
            <small>{item.note}</small>
          </div>
        ))}
      </section>
    </div>
  );
}

type BrandResourceWorkbenchProps = {
  activePackage: L3Package;
};

function BrandResourceWorkbench({ activePackage }: BrandResourceWorkbenchProps) {
  if (activePackage.id === "visual-assets") {
    return <LogoAssetWorkbench />;
  }

  if (activePackage.id === "font-packages") {
    return <FontPackageWorkbench />;
  }

  if (activePackage.id !== "brand-guidelines") {
    return (
      <RoutePlaceholder
        activePackage={activePackage}
        route={getRouteById("brand-assets.public-library")}
      />
    );
  }

  return (
    <div className="resourceWorkbench">
      <section className="resourceDetailPanel">
        <header className="resourceHeader">
          <span className="sectionKicker">brand guideline</span>
          <h2>{brandGuidelineAsset.title}</h2>
          <p>{brandGuidelineAsset.summary}</p>
        </header>

        <div className="resourceActions">
          <a
            className="primaryButton"
            href={brandGuidelineAsset.href}
            download="Viaim 260309 Internal Draft.pdf"
          >
            <Download size={15} />
            <span>download pdf</span>
          </a>
          <a
            className="barButton"
            href={brandGuidelineAsset.href}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink size={15} />
            <span>open preview</span>
          </a>
        </div>

        <div className="resourceMetaGrid">
          <InspectorRow label="version" value={brandGuidelineAsset.version} />
          <InspectorRow label="status" value={brandGuidelineAsset.status} />
          <InspectorRow label="format" value={brandGuidelineAsset.format} />
          <InspectorRow label="size" value={brandGuidelineAsset.size} />
          <InspectorRow label="source date" value={brandGuidelineAsset.sourceDate} />
          <InspectorRow label="added" value={brandGuidelineAsset.updatedAt} />
        </div>

        <section className="versionHistory" aria-label="Version history">
          <header>
            <span>version history</span>
            <strong>{brandGuidelineVersions.length} release</strong>
          </header>
          <div className="versionList">
            {brandGuidelineVersions.map((item) => (
              <a className="versionItem" href={item.href} key={item.version}>
                <FileText size={16} />
                <span>
                  <strong>{item.version}</strong>
                  <small>{item.date} / {item.note}</small>
                </span>
                <i>{item.status}</i>
              </a>
            ))}
          </div>
        </section>
      </section>

      <section className="pdfPreviewPanel">
        <header>
          <span>pdf preview</span>
          <strong>{brandGuidelineAsset.version}</strong>
        </header>
        <object
          aria-label={brandGuidelineAsset.title}
          className="pdfFrame"
          data={brandGuidelineAsset.href}
          type="application/pdf"
        >
          <div className="pdfFallback">
            <FileText size={18} />
            <span>PDF preview unavailable</span>
            <a href={brandGuidelineAsset.href} download="Viaim 260309 Internal Draft.pdf">
              download pdf
            </a>
          </div>
        </object>
      </section>
    </div>
  );
}

type FigmaProjectDashboardWorkbenchProps = {
  activePackage: L3Package;
  config: ThemeConfig;
};

function FigmaProjectDashboardWorkbench({
  activePackage,
  config,
}: FigmaProjectDashboardWorkbenchProps) {
  const view = activePackage.id === "changelog" ? "changelog" : "map";
  const dashboardParams = new URLSearchParams({
    embed: "platform",
    view,
    bg: colorValue(config.bg, defaultThemeConfigs[DEFAULT_THEME_ID].bg),
    surface: colorValue(config.surface, defaultThemeConfigs[DEFAULT_THEME_ID].surface),
    surfaceRaised: colorValue(
      config.surfaceRaised,
      defaultThemeConfigs[DEFAULT_THEME_ID].surfaceRaised,
    ),
    surfaceSoft: colorValue(
      config.surfaceSoft,
      defaultThemeConfigs[DEFAULT_THEME_ID].surfaceSoft,
    ),
    navActiveBg: colorValue(
      config.navActiveBg,
      defaultThemeConfigs[DEFAULT_THEME_ID].navActiveBg,
    ),
    border: colorValue(config.border, defaultThemeConfigs[DEFAULT_THEME_ID].border),
    text: colorValue(config.text, defaultThemeConfigs[DEFAULT_THEME_ID].text),
    textSecondary: colorValue(
      config.textSecondary,
      defaultThemeConfigs[DEFAULT_THEME_ID].textSecondary,
    ),
    muted: colorValue(config.muted, defaultThemeConfigs[DEFAULT_THEME_ID].muted),
    accent: colorValue(config.accent, defaultThemeConfigs[DEFAULT_THEME_ID].accent),
    danger: colorValue(config.danger, defaultThemeConfigs[DEFAULT_THEME_ID].danger),
    uiFont: config.uiFont,
    codeFont: config.codeFont,
    uiSize: String(config.uiFontSize),
    codeSize: String(config.codeFontSize),
  });
  const dashboardSrc = `${FIGMA_PROJECT_DASHBOARD_SRC}?${dashboardParams.toString()}`;

  return (
    <div className="figmaDashboardWorkbench">
      <iframe
        key={view}
        className="figmaDashboardFrame"
        src={dashboardSrc}
        title={`Figma project ${view}`}
      />
    </div>
  );
}

function LogoAssetWorkbench() {
  const [viewMode, setViewMode] = useState<LogoViewMode>("grid");
  const formatCount = brandLogoAssets.reduce(
    (count, asset) => count + asset.formats.length,
    0,
  );

  return (
    <div className="logoAssetWorkbench">
      <section className="assetHeroPanel">
        <span className="assetHeroIcon" aria-hidden="true">
          <ImageIcon size={18} />
        </span>
        <div>
          <span className="sectionKicker">logo collection</span>
          <h2>viaim 单 Logo</h2>
          <p>透明底 Logo 集合，默认使用 Photoshop 风格棋盘底检查边缘和浅色变体。</p>
        </div>

        <div className="assetHeroStats" aria-label="Logo collection stats">
          <span>
            <strong>{brandLogoAssets.length}</strong>
            <small>variants</small>
          </span>
          <span>
            <strong>{formatCount}</strong>
            <small>files</small>
          </span>
          <span>
            <strong>4710</strong>
            <small>px wide</small>
          </span>
        </div>
      </section>

      <section className="assetLibraryPanel">
        <header className="assetLibraryHeader">
          <div>
            <span className="sectionKicker">visual assets</span>
            <h3>Logo 图片集合</h3>
          </div>
          <div className="modeSwitch assetModeSwitch" aria-label="Logo view mode">
            <button
              type="button"
              data-active={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
            >
              <Grid2X2 size={14} />
              平铺
            </button>
            <button
              type="button"
              data-active={viewMode === "list"}
              onClick={() => setViewMode("list")}
            >
              <List size={14} />
              列表
            </button>
          </div>
        </header>

        <div className="logoGallery" data-view={viewMode}>
          {brandLogoAssets.map((asset) => (
            <article className="logoAssetCard" key={asset.id}>
              <div className="transparentPreview logoPreview">
                <img src={asset.previewHref} alt={asset.title} />
              </div>
              <div className="logoAssetCopy">
                <span>{asset.context}</span>
                <h4>{asset.title}</h4>
                <p>{asset.usage}</p>
                <small>{asset.dimensions}</small>
              </div>
              <LogoFormatLinks formats={asset.formats} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

type LogoFormatLinksProps = {
  formats: BrandLogoFormat[];
};

function LogoFormatLinks({ formats }: LogoFormatLinksProps) {
  return (
    <div className="assetFormatLinks">
      {formats.map((format) => (
        <a
          href={format.href}
          download={format.fileName}
          key={format.fileName}
          title={format.fileName}
        >
          <Download size={13} />
          <span>{format.label}</span>
          <small>{format.size}</small>
        </a>
      ))}
    </div>
  );
}

function FontPackageWorkbench() {
  const [selectedFontId, setSelectedFontId] = useState("misans-regular");
  const [previewText, setPreviewText] = useState(defaultFontPreviewText);
  const selectedFont =
    brandFontAssets.find((font) => font.id === selectedFontId) ??
    brandFontAssets[4];
  const previewContent = previewText.trim() || defaultFontPreviewText;
  const previewStyle = {
    fontFamily: '"MiSansBrandPreview", var(--ui-font)',
    fontWeight: selectedFont.weight,
  } as React.CSSProperties;
  const fontSamples = [
    { label: "display", size: "42px", text: "viaim" },
    { label: "headline", size: "28px", text: "We Aim to Explore." },
    { label: "body", size: "16px", text: "实时记录、整理和理解每一次重要对话。" },
  ];

  return (
    <div className="fontPackageWorkbench">
      <section className="fontListPanel">
        <header className="assetLibraryHeader">
          <div>
            <span className="sectionKicker">font package</span>
            <h3>MiSans OTF</h3>
          </div>
          <span className="assetCountBadge">{brandFontAssets.length} weights</span>
        </header>

        <div className="fontWeightList">
          {brandFontAssets.map((font) => (
            <button
              className="fontWeightButton"
              type="button"
              key={font.id}
              data-active={font.id === selectedFont.id}
              onClick={() => setSelectedFontId(font.id)}
            >
              <Type size={16} />
              <span>
                <strong>{font.label}</strong>
                <small>{font.fileName} / {font.size}</small>
              </span>
              <i>{font.weight}</i>
            </button>
          ))}
        </div>
      </section>

      <section className="fontPreviewPanel">
        <header className="fontPreviewHeader">
          <div>
            <span className="sectionKicker">type preview</span>
            <h3>{selectedFont.label}</h3>
          </div>
          <a className="barButton" href={selectedFont.href} download={selectedFont.fileName}>
            <Download size={14} />
            <span>download otf</span>
          </a>
        </header>

        <div className="fontPreviewControls">
          <label className="fontPreviewInput">
            <span>
              <TextCursorInput size={14} />
              预览文本
            </span>
            <textarea
              className="fontPreviewTextarea"
              value={previewText}
              rows={3}
              spellCheck={false}
              onChange={(event) => setPreviewText(event.target.value)}
            />
          </label>
        </div>

        <div className="fontPreviewStage" style={previewStyle}>
          <span>{selectedFont.role}</span>
          <p>{previewContent}</p>
        </div>

        <div className="fontSampleGrid" aria-label="Font size samples">
          {fontSamples.map((sample) => (
            <div className="fontSampleRow" key={sample.label}>
              <span>{sample.label}</span>
              <strong
                style={{
                  ...previewStyle,
                  fontSize: sample.size,
                }}
              >
                {sample.text}
              </strong>
            </div>
          ))}
        </div>

        <div className="resourceMetaGrid fontMetaGrid">
          <InspectorRow label="family" value="MiSans" />
          <InspectorRow label="weight" value={`${selectedFont.weight}`} />
          <InspectorRow label="file" value={selectedFont.fileName} />
          <InspectorRow label="size" value={selectedFont.size} />
        </div>
      </section>
    </div>
  );
}

type RouteInspectorPanelProps = {
  account: FeishuAccount | null;
  activeTheme: ThemePresetId;
  activePackage: L3Package;
  activeRoute: WorkspaceRoute;
  config: ThemeConfig;
  role: AccountRole | null;
  themeMode: ThemeMode;
  onAuthOpen: () => void;
};

function RouteInspectorPanel({
  account,
  activeTheme,
  activePackage,
  activeRoute,
  config,
  role,
  themeMode,
  onAuthOpen,
}: RouteInspectorPanelProps) {
  const permissionRows = activeRoute.l3Packages.map((item) => ({
    label: item.label,
    enabled: canAccessRole(role, item.minimumRole ?? activeRoute.minimumRole),
  }));
  const domainLabel =
    primaryDomains.find((domain) => domain.id === activeRoute.l1Id)?.label ??
    activeRoute.l1Id;

  return (
    <aside className="inspectorPanel" aria-label="Inspector">
      <section className="inspectorSection">
        <header>
          <span>selection</span>
          <strong>{activePackage.label}</strong>
        </header>
        <div className="inspectorRows">
          <InspectorRow label="domain" value={domainLabel} />
          <InspectorRow label="view" value={activeRoute.l2Label} />
          <InspectorRow label="package" value={activePackage.label} />
          <InspectorRow label="surface" value={activeRoute.surface} />
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
          <span>properties</span>
          <strong>{activePackage.kind}</strong>
        </header>
        <div className="inspectorRows">
          <InspectorRow
            label="minimum"
            value={activePackage.minimumRole ?? activeRoute.minimumRole}
          />
          <InspectorRow label="package type" value={activePackage.kind} />
          <InspectorRow label="queue" value={activeRoute.queue} />
          <InspectorRow label="sections" value={activeRoute.inspectorSections.join(" / ")} />
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
          <strong>{activeRoute.status}</strong>
        </header>
        <div className="inspectorRows">
          <InspectorRow label="mode" value={themeMode} />
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
  authStatus: AuthStatus | null;
  onClose: () => void;
  onRoleChange: (role: AccountRole) => void;
  onSignIn: (role: AccountRole) => void;
  onSignOut: () => void;
};

function AuthDialog({
  account,
  authStatus,
  onClose,
  onRoleChange,
  onSignIn,
  onSignOut,
}: AuthDialogProps) {
  const [selectedRole, setSelectedRole] = useState<AccountRole>(
    account?.role ?? "designer",
  );
  const oauthSetup = getFeishuOAuthSetup();

  function submitSignIn() {
    const feishuOAuthUrl = buildFeishuOAuthUrl(selectedRole);

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
          {authStatus ? (
            <div className="authNotice" data-tone={authStatus.tone}>
              <span>{authStatus.message}</span>
            </div>
          ) : null}

          <div className="authNotice" data-tone={oauthSetup.hasAppId ? "neutral" : "danger"}>
            <span>
              {oauthSetup.hasAppId
                ? oauthSetup.hasExchangeEndpoint
                  ? "Feishu OAuth is configured."
                  : "Feishu OAuth app is configured. Token exchange endpoint is missing."
                : "Feishu OAuth app id is missing. Demo login is still available."}
            </span>
            <small>{oauthSetup.redirectUri}</small>
          </div>

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
            {workspaceRoutes.map((route) => {
              const checked = canAccessRole(account?.role ?? selectedRole, route.minimumRole);
              return (
                <div className="permissionRow" key={route.id} data-enabled={checked}>
                  <span>{route.l2Label}</span>
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
              <span>{oauthSetup.hasAppId ? "continue with feishu" : "use feishu demo"}</span>
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
