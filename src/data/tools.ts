import {
  AppWindow,
  Figma,
  Images,
  LayoutTemplate,
  Scissors,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ToolId =
  | "open-design"
  | "slice-export"
  | "figma-projects"
  | "mage-gallery"
  | "templates"
  | "uploads"
  | "settings";

export type AccountRole = "owner" | "designer" | "viewer";
export type MinimumRole = AccountRole | "guest";

export type ToolItem = {
  id: ToolId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  minimumRole: MinimumRole;
};

export const roles: Array<{ id: AccountRole; label: string }> = [
  { id: "owner", label: "Owner" },
  { id: "designer", label: "Designer" },
  { id: "viewer", label: "Viewer" },
];

export const toolItems: ToolItem[] = [
  {
    id: "open-design",
    label: "Open Design",
    shortLabel: "open design",
    icon: AppWindow,
    minimumRole: "designer",
  },
  {
    id: "slice-export",
    label: "Slice Tool",
    shortLabel: "slice",
    icon: Scissors,
    minimumRole: "designer",
  },
  {
    id: "figma-projects",
    label: "Figma Projects",
    shortLabel: "figma",
    icon: Figma,
    minimumRole: "viewer",
  },
  {
    id: "mage-gallery",
    label: "Mage Gallery",
    shortLabel: "gallery",
    icon: Images,
    minimumRole: "viewer",
  },
  {
    id: "templates",
    label: "Templates",
    shortLabel: "templates",
    icon: LayoutTemplate,
    minimumRole: "designer",
  },
  {
    id: "uploads",
    label: "Uploads",
    shortLabel: "uploads",
    icon: Upload,
    minimumRole: "designer",
  },
  {
    id: "settings",
    label: "Settings",
    shortLabel: "settings",
    icon: SlidersHorizontal,
    minimumRole: "guest",
  },
];

const roleWeight: Record<AccountRole, number> = {
  viewer: 1,
  designer: 2,
  owner: 3,
};

export function canAccessTool(role: AccountRole | null, tool: ToolItem) {
  if (tool.minimumRole === "guest") {
    return true;
  }

  if (!role) {
    return false;
  }

  return roleWeight[role] >= roleWeight[tool.minimumRole];
}

export function getToolById(toolId: ToolId) {
  return toolItems.find((tool) => tool.id === toolId) ?? toolItems[0];
}
