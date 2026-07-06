import type { AccountRole } from "../data/tools";

export type FeishuAccount = {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
};

const STORAGE_KEY = "vision-design-platform.feishu-account";
const OAUTH_STATE_STORAGE_KEY = "vision-design-platform.feishu-oauth-state";

type FeishuOAuthState = {
  createdAt: number;
  redirectUri: string;
  role: AccountRole;
  state: string;
};

type FeishuOAuthExchangeResponse = {
  account?: Partial<FeishuAccount>;
  user?: Record<string, unknown>;
  data?: {
    account?: Partial<FeishuAccount>;
    user?: Record<string, unknown>;
    role?: string;
  };
  role?: string;
};

export type FeishuOAuthCallbackResult =
  | {
      status: "none";
    }
  | {
      message: string;
      status: "error";
    }
  | {
      account: FeishuAccount;
      message: string;
      status: "success";
    };

export type FeishuOAuthSetup = {
  exchangeEndpoint: string | null;
  hasAppId: boolean;
  hasExchangeEndpoint: boolean;
  redirectUri: string;
};

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

export function getFeishuOAuthSetup(): FeishuOAuthSetup {
  const appId = import.meta.env.VITE_FEISHU_APP_ID as string | undefined;
  const exchangeEndpoint = trimEnv(
    import.meta.env.VITE_FEISHU_OAUTH_EXCHANGE_URL as string | undefined,
  );
  const redirectUri = getFeishuRedirectUri();

  return {
    exchangeEndpoint,
    hasAppId: Boolean(trimEnv(appId)),
    hasExchangeEndpoint: Boolean(exchangeEndpoint),
    redirectUri,
  };
}

export function buildFeishuOAuthUrl(role: AccountRole = "viewer") {
  const appId = trimEnv(import.meta.env.VITE_FEISHU_APP_ID as string | undefined);
  const redirectUri = getFeishuRedirectUri();

  if (!appId) {
    return null;
  }

  const state = createOAuthState();
  const statePayload: FeishuOAuthState = {
    createdAt: Date.now(),
    redirectUri,
    role,
    state,
  };

  window.localStorage.setItem(
    OAUTH_STATE_STORAGE_KEY,
    JSON.stringify(statePayload),
  );

  const params = new URLSearchParams({
    app_id: appId,
    redirect_uri: redirectUri,
    response_type: "code",
    state,
  });

  return `https://open.feishu.cn/open-apis/authen/v1/index?${params.toString()}`;
}

export async function consumeFeishuOAuthCallback(): Promise<FeishuOAuthCallbackResult> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error =
    url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (!code && !error) {
    return { status: "none" };
  }

  stripFeishuOAuthParams(url);

  if (error) {
    clearStoredOAuthState();
    return {
      message: `Feishu OAuth failed: ${error}`,
      status: "error",
    };
  }

  if (!code || !state) {
    clearStoredOAuthState();
    return {
      message: "Feishu OAuth callback is missing code or state.",
      status: "error",
    };
  }

  const storedState = readStoredOAuthState();

  if (!storedState || storedState.state !== state) {
    clearStoredOAuthState();
    return {
      message: "Feishu OAuth state mismatch. Please start login again.",
      status: "error",
    };
  }

  if (Date.now() - storedState.createdAt > 10 * 60 * 1000) {
    clearStoredOAuthState();
    return {
      message: "Feishu OAuth code expired. Please start login again.",
      status: "error",
    };
  }

  const exchangeEndpoint = getFeishuOAuthSetup().exchangeEndpoint;

  if (!exchangeEndpoint) {
    clearStoredOAuthState();
    return {
      message:
        "Feishu OAuth code received. Configure VITE_FEISHU_OAUTH_EXCHANGE_URL to exchange it securely.",
      status: "error",
    };
  }

  try {
    const response = await fetch(exchangeEndpoint, {
      body: JSON.stringify({
        code,
        redirectUri: storedState.redirectUri,
        requestedRole: storedState.role,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`exchange failed with HTTP ${response.status}`);
    }

    const payload = (await response.json()) as FeishuOAuthExchangeResponse;
    const account = normalizeExchangeAccount(payload, storedState.role);

    if (!account) {
      throw new Error("exchange response did not include user profile");
    }

    clearStoredOAuthState();

    return {
      account,
      message: "Feishu OAuth connected.",
      status: "success",
    };
  } catch (caughtError) {
    clearStoredOAuthState();

    return {
      message:
        caughtError instanceof Error
          ? caughtError.message
          : "Feishu OAuth exchange failed.",
      status: "error",
    };
  }
}

function trimEnv(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function getFeishuRedirectUri() {
  const configuredRedirectUri = trimEnv(
    import.meta.env.VITE_FEISHU_REDIRECT_URI as string | undefined,
  );

  if (configuredRedirectUri) {
    return configuredRedirectUri;
  }

  const currentUrl = new URL(window.location.href);
  currentUrl.hash = "";
  currentUrl.search = "";
  return currentUrl.toString();
}

function createOAuthState() {
  const randomValue = new Uint32Array(4);
  window.crypto.getRandomValues(randomValue);

  return `vision-design-platform.${Date.now()}.${Array.from(randomValue)
    .map((value) => value.toString(16).padStart(8, "0"))
    .join("")}`;
}

function readStoredOAuthState() {
  const raw = window.localStorage.getItem(OAUTH_STATE_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as FeishuOAuthState;
  } catch {
    clearStoredOAuthState();
    return null;
  }
}

function clearStoredOAuthState() {
  window.localStorage.removeItem(OAUTH_STATE_STORAGE_KEY);
}

function stripFeishuOAuthParams(url: URL) {
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");

  window.history.replaceState(
    {},
    document.title,
    `${url.pathname}${url.search}${url.hash}`,
  );
}

function normalizeExchangeAccount(
  payload: FeishuOAuthExchangeResponse,
  fallbackRole: AccountRole,
) {
  const account = payload.account ?? payload.data?.account;
  const user = payload.user ?? payload.data?.user ?? {};
  const role = normalizeRole(payload.role ?? payload.data?.role) ?? fallbackRole;
  const id =
    stringValue(account?.id) ??
    stringValue(user.id) ??
    stringValue(user.open_id) ??
    stringValue(user.union_id) ??
    stringValue(user.user_id);
  const name =
    stringValue(account?.name) ??
    stringValue(user.name) ??
    stringValue(user.en_name) ??
    stringValue(user.nickname) ??
    stringValue(user.display_name);
  const email =
    stringValue(account?.email) ??
    stringValue(user.email) ??
    stringValue(user.enterprise_email) ??
    "feishu-user@local";

  if (!id || !name) {
    return null;
  }

  return {
    id,
    name,
    email,
    role,
  };
}

function normalizeRole(value?: string) {
  if (value === "owner" || value === "designer" || value === "viewer") {
    return value;
  }

  return null;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}
