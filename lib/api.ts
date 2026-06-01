export type ApiError = Error & { status?: number; body?: unknown };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

export const isApiError = (e: unknown): e is ApiError => {
  return e instanceof Error && ("status" in e || "body" in e);
};

export const getApiErrorMessage = (e: unknown, fallback: string) => {
  if (isApiError(e)) {
    const detail =
      isRecord(e.body) && typeof e.body.error === "string" ? e.body.error : "";
    return detail ? `${e.message}: ${detail}` : e.message;
  }
  return e instanceof Error ? e.message : fallback;
};

const getApiBase = () => {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  return base.replace(/\/+$/, "");
};

const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, ...init } = options;
  const url = `${getApiBase()}${path.startsWith("/") ? "" : "/"}${path}`;

  const headers = new Headers(init.headers || {});

  if (auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...init, headers });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const err: ApiError = new Error(
      (isRecord(body) && typeof body.message === "string"
        ? body.message
        : `Request failed with ${res.status}`)
    );
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body as T;
}

export async function uploadBodyProgressMe(form: FormData) {
  return apiFetch<{ entry: unknown; message: string }>("/api/body-progress/me", {
    method: "POST",
    body: form,
  });
}

export async function updateBodyProgressMe(entryId: string, form: FormData) {
  return apiFetch<{ entry: unknown; message: string }>(
    `/api/body-progress/me/${entryId}`,
    {
      method: "PUT",
      body: form,
    }
  );
}

export async function getBodyProgressMe() {
  return apiFetch<{ entries: unknown[] }>("/api/body-progress/me");
}

export async function getBodyProgressStatusMe() {
  return apiFetch<{
    baseline: unknown | null;
    latest: unknown | null;
    hasAny: boolean;
    hasBaseline: boolean;
    sameEntry: boolean;
  }>("/api/body-progress/me/status");
}

export async function getBodyProgressUser(userId: string) {
  return apiFetch<{ entries: unknown[] }>(`/api/body-progress/user/${userId}`);
}

export async function getBodyProgressStatusUser(userId: string) {
  return apiFetch<{
    baseline: unknown | null;
    latest: unknown | null;
    hasAny: boolean;
    hasBaseline: boolean;
    sameEntry: boolean;
  }>(`/api/body-progress/user/${userId}/status`);
}

export async function uploadBodyProgressUser(userId: string, form: FormData) {
  return apiFetch<{ entry: unknown; message: string }>(
    `/api/body-progress/user/${userId}`,
    {
      method: "POST",
      body: form,
    }
  );
}

export async function updateBodyProgressUser(
  userId: string,
  entryId: string,
  form: FormData
) {
  return apiFetch<{ entry: unknown; message: string }>(
    `/api/body-progress/user/${userId}/${entryId}`,
    { method: "PUT", body: form }
  );
}

// Legacy Claims API
export async function getLegacyClaims() {
  return apiFetch<{
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
    };
    claimId: string;
    legacyPlan: string;
    status: string;
    claimedAt: string;
    ledgerDetails: string;
    notes: string;
  }[]>("/api/admin/legacy-claims");
}

export async function approveLegacyClaim(claimId: string) {
  return apiFetch<{ message: string; claim: unknown; user: unknown }>(
    `/api/admin/legacy-claims/${claimId}/approve`,
    { method: "PUT" }
  );
}
