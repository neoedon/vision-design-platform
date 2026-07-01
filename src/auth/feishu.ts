import type { AccountRole } from "../data/tools";

export type FeishuAccount = {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
};

const STORAGE_KEY = "vision-design-platform.feishu-account";

export function loadFeishuAccount(): FeishuAccount | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as FeishuAccount;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveFeishuAccount(account: FeishuAccount | null) {
  if (!account) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
}

export function createDemoFeishuAccount(role: AccountRole): FeishuAccount {
  return {
    id: "ou_demo_vision_design",
    name: "Jiaqi Tang",
    email: "jiaqi.tang@example.com",
    role,
  };
}

export function buildFeishuOAuthUrl() {
  const appId = import.meta.env.VITE_FEISHU_APP_ID as string | undefined;
  const redirectUri =
    (import.meta.env.VITE_FEISHU_REDIRECT_URI as string | undefined) ||
    window.location.origin;

  if (!appId) {
    return null;
  }

  const params = new URLSearchParams({
    app_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    state: "vision-design-platform",
  });

  return `https://open.feishu.cn/open-apis/authen/v1/index?${params.toString()}`;
}
