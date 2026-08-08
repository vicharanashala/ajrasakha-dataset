import { useState, useCallback, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import {
  FlaskConical,
  Loader2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  X,
  FileJson,
  Copy,
  Key,
  User,
} from "lucide-react";
import { type AvailableFilters, type FilterOptionType } from "@/services/api";

// Re-export so callers can use it without an extra import
export type { FilterOptionType };

type PlaygroundEndpoint = "questions" | "filter-options";
type Params = Record<string, string>;

const ENDPOINTS: {
  id: PlaygroundEndpoint;
  label: string;
  path: string;
  desc: string;
}[] = [
  {
    id: "questions",
    label: "Questions",
    path: "/public/questions",
    desc: "Paginated question list with optional filters",
  },
  {
    id: "filter-options",
    label: "Filter Options",
    path: "/public/filter-options",
    desc: "Discover available filter values",
  },
];

const FILTER_OPTION_TYPES: FilterOptionType[] = ["district", "crop", "domain"];

const FIELD_BASE =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono h-9";
const FIELD_SM = `${FIELD_BASE} h-8 text-xs`;
const LABEL = "block text-xs font-medium text-muted-foreground mb-1.5";

type AuthMode = "jwt" | "api-key";

function getStoredKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("playground_api_key") || "";
}

function AuthModeSelector({
  mode,
  onModeChange,
  isWhitelisted,
}: {
  mode: AuthMode;
  onModeChange: (m: AuthMode) => void;
  isWhitelisted: boolean;
}) {
  // The auth mode is locked to match the user's whitelist status.
  // Whitelisted -> API Key only. Non-whitelisted -> JWT only.
  const isLocked = true;

  return (
    <div>
      <label className={LABEL}>
        Auth Mode
        {isWhitelisted ? " (API Key)" : " (Session JWT)"}
      </label>
      <div className="flex gap-3">
        <button
          type="button"
          disabled={isLocked}
          onClick={() => !isLocked && onModeChange("jwt")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border py-2 text-xs font-medium transition-colors ${
            mode === "jwt"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:bg-muted"
          } ${isLocked && mode !== "jwt" ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          <User className="h-3.5 w-3.5" />
          Session JWT
        </button>
        <button
          type="button"
          disabled={isLocked}
          onClick={() => !isLocked && onModeChange("api-key")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border py-2 text-xs font-medium transition-colors ${
            mode === "api-key"
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-background text-muted-foreground hover:bg-muted"
          } ${isLocked && mode !== "api-key" ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          <Key className="h-3.5 w-3.5" />
          API Key
        </button>
      </div>
    </div>
  );
}

function MethodPill({ className = "" }: { className?: string }) {
  return (
    <span
      className={`rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-primary ${className}`}
    >
      GET
    </span>
  );
}

function PlaygroundEndpointSelector({
  selected,
  onChange,
}: {
  selected: PlaygroundEndpoint;
  onChange: (id: PlaygroundEndpoint) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = ENDPOINTS.find((e) => e.id === selected)!;

  return (
    <div className="relative">
      <label className={LABEL}>Endpoint</label>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:bg-muted"
      >
        <span className="flex min-w-0 items-center gap-2">
          <MethodPill />
          <span className="truncate font-mono text-xs">{current.path}</span>
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg"
        >
          {ENDPOINTS.map((e) => (
            <button
              key={e.id}
              type="button"
              role="option"
              aria-selected={e.id === selected}
              onClick={() => {
                onChange(e.id);
                setOpen(false);
              }}
              className={`w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted ${
                e.id === selected ? "bg-muted" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                <MethodPill />
                <span className="font-mono text-xs">{e.path}</span>
              </span>
              <p className="mt-1 text-xs text-muted-foreground">{e.desc}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface QueryParamsProps {
  endpoint: PlaygroundEndpoint;
  params: Params;
  onChange: (key: string, value: string) => void;
  filters: AvailableFilters | null;
  filtersLoading: boolean;
  onLoadFilters: () => void;
}

function QueryParams({
  endpoint,
  params,
  onChange,
  filters,
  filtersLoading,
  onLoadFilters,
}: QueryParamsProps) {
  if (endpoint === "questions") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>page</label>
            <input
              type="number"
              min={1}
              value={params.page ?? ""}
              onChange={(e) => onChange("page", e.target.value)}
              placeholder="1"
              className={FIELD_SM}
            />
          </div>
          <div>
            <label className={LABEL}>limit</label>
            <input
              type="number"
              min={1}
              value={params.limit ?? ""}
              onChange={(e) => onChange("limit", e.target.value)}
              placeholder="20"
              className={FIELD_SM}
            />
          </div>
        </div>

        <div>
          <label className={LABEL}>state</label>
          {filtersLoading ? (
            <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading...
            </div>
          ) : filters?.states.length ? (
            <select
              value={params.state ?? ""}
              onChange={(e) => onChange("state", e.target.value)}
              className={FIELD_BASE}
            >
              <option value="">All states</option>
              {filters.states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={params.state ?? ""}
                onChange={(e) => onChange("state", e.target.value)}
                placeholder="West Bengal"
                className={FIELD_SM}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={onLoadFilters}
                aria-label="Load available states"
                title="Load available states"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div>
          <label className={LABEL}>crop</label>
          <input
            value={params.crop ?? ""}
            onChange={(e) => onChange("crop", e.target.value)}
            placeholder="Rice, Wheat"
            className={FIELD_SM}
          />
        </div>

        <div>
          <label className={LABEL}>district</label>
          <input
            value={params.district ?? ""}
            onChange={(e) => onChange("district", e.target.value)}
            placeholder="Kolkata"
            className={FIELD_SM}
          />
        </div>

        <div>
          <label className={LABEL}>domain</label>
          <input
            value={params.domain ?? ""}
            onChange={(e) => onChange("domain", e.target.value)}
            placeholder="Pest Management"
            className={FIELD_SM}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <label className={LABEL}>
          type <span className="text-destructive">*</span>
        </label>
        <select
          value={params.type ?? ""}
          onChange={(e) => onChange("type", e.target.value)}
          className={FIELD_BASE}
        >
          <option value="">Select type...</option>
          {FILTER_OPTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL}>state</label>
        <input
          value={params.state ?? ""}
          onChange={(e) => onChange("state", e.target.value)}
          placeholder="West Bengal"
          className={FIELD_SM}
        />
      </div>

      <div>
        <label className={LABEL}>district</label>
        <input
          value={params.district ?? ""}
          onChange={(e) => onChange("district", e.target.value)}
          placeholder="Kolkata"
          className={FIELD_SM}
        />
      </div>

      <div>
        <label className={LABEL}>crop</label>
        <input
          value={params.crop ?? ""}
          onChange={(e) => onChange("crop", e.target.value)}
          placeholder="Rice"
          className={FIELD_SM}
        />
      </div>
    </div>
  );
}

function buildUrl(
  baseUrl: string,
  endpoint: PlaygroundEndpoint,
  params: Params,
) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });
  const qs = searchParams.toString();
  const ep = ENDPOINTS.find((e) => e.id === endpoint)!;
  return `${baseUrl}${ep.path}${qs ? `?${qs}` : ""}`;
}

function StatusBadge({
  status,
  statusText,
}: {
  status: number;
  statusText: string;
}) {
  const isSuccess = status >= 200 && status < 300;
  return (
    <span
      className={`rounded px-2 py-0.5 font-mono text-xs font-semibold ${
        isSuccess
          ? "bg-primary/10 text-primary"
          : "bg-destructive/10 text-destructive"
      }`}
    >
      {status} {statusText}
    </span>
  );
}

interface ApiPlaygroundModalProps {
  open: boolean;
  onClose: () => void;
  filters: AvailableFilters | null;
  filtersLoading: boolean;
  onLoadFilters: () => void;
  isWhitelisted: boolean;
}

export function ApiPlaygroundModal({
  open,
  onClose,
  isWhitelisted,
  filters,
  filtersLoading,
  onLoadFilters,
}: ApiPlaygroundModalProps) {
  const [endpoint, setEndpoint] = useState<PlaygroundEndpoint>("questions");
  const [authMode, setAuthMode] = useState<AuthMode>(isWhitelisted ? "api-key" : "jwt");
  const [apiKey, setApiKey] = useState(getStoredKey);
  const [params, setParams] = useState<Params>({});
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    time: number;
    data: unknown;
    error?: string;
  } | null>(null);

  const baseUrl = import.meta.env.VITE_API_URL || "/api";
  const builtUrl = buildUrl(baseUrl, endpoint, params);

  // Reset response when params change
  useEffect(() => {
    setResponse(null);
  }, [endpoint, params]);

  // Reset state when modal opens fresh
  useEffect(() => {
    if (open) {
      setResponse(null);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleParamChange = useCallback((key: string, value: string) => {
    setParams((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  }, []);

  const handleSend = useCallback(async () => {
    if (authMode === "api-key" && !apiKey.trim()) {
      setResponse({
        status: 0,
        statusText: "",
        time: 0,
        data: null,
        error: "Please enter an API key",
      });
      return;
    }
    if (endpoint === "filter-options" && !params.type) {
      setResponse({
        status: 0,
        statusText: "",
        time: 0,
        data: null,
        error: "type parameter is required for filter-options endpoint",
      });
      return;
    }

    setLoading(true);
    setResponse(null);

    const headers: Record<string, string> = {};
    if (authMode === "api-key") {
      headers["Authorization"] = `Bearer ${apiKey.trim()}`;
    }
    // JWT auth mode: browser sends cookie/header via the axios interceptor
    // when called through the `api` instance. Since we use raw axios here,
    // grab the token from localStorage manually.
    if (authMode === "jwt") {
      const token = localStorage.getItem("ajrasakha_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const start = Date.now();
    try {
      const url = buildUrl(baseUrl, endpoint, params);
      const res = await axios.get(url, {
        headers,
        validateStatus: () => true,
      });
      setResponse({
        status: res.status,
        statusText: res.statusText,
        time: Date.now() - start,
        data: res.data,
      });
    } catch (err) {
      const axiosErr = err as AxiosError;
      setResponse({
        status: axiosErr.response?.status || 0,
        statusText: axiosErr.message,
        time: Date.now() - start,
        data: null,
        error: axiosErr.message,
      });
    } finally {
      setLoading(false);
    }
  }, [authMode, apiKey, endpoint, params, baseUrl]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="API Playground"
        className="relative z-10 flex h-[90vh] w-full max-w-[1600px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                API Playground
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Make live requests to the Ajrasakha API
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onClose}
            aria-label="Close playground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Two-column body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          {/* LEFT — Request */}
          <div className="flex min-h-0 flex-col border-b border-border md:border-b-0 md:border-r">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
              {/* URL Preview */}
              <div>
                <span className={LABEL}>Request URL</span>
                <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2">
                  <MethodPill className="mt-0.5" />
                  <code className="break-all font-mono text-xs text-foreground">
                    {builtUrl}
                  </code>
                </div>
              </div>

              {/* Endpoint selector */}
              <PlaygroundEndpointSelector
                selected={endpoint}
                onChange={(id) => {
                  setEndpoint(id);
                  setParams({});
                }}
              />

              {/* Auth mode — show selector only when the user's type is unknown (dev fallback) */}
              <AuthModeSelector mode={authMode} onModeChange={setAuthMode} isWhitelisted={isWhitelisted} />

              {/* API Key input — shown only when API key mode is selected */}
              {authMode === "api-key" && (
                <div>
                  <label className={LABEL}>API Key</label>
                  <input
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      localStorage.setItem("playground_api_key", e.target.value);
                    }}
                    placeholder="ajr_..."
                    className={FIELD_SM}
                  />
                </div>
              )}

              {/* JWT auth notice */}
              {authMode === "jwt" && (
                <div>
                  <label className={LABEL}>Authentication</label>
                  <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    Your session JWT is sent automatically. Non-whitelisted
                    users only.
                  </div>
                </div>
              )}

              {/* Query params */}
              <QueryParams
                endpoint={endpoint}
                params={params}
                onChange={handleParamChange}
                filters={filters}
                filtersLoading={filtersLoading}
                onLoadFilters={onLoadFilters}
              />
            </div>

            {/* Send button — pinned to bottom of left panel */}
            <div className="border-t border-border p-4">
              <Button
                type="button"
                className="w-full"
                onClick={handleSend}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FlaskConical className="mr-2 h-4 w-4" />
                )}
                Send Request
              </Button>
            </div>
          </div>

          {/* RIGHT — Response */}
          <div className="flex min-h-0 flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold text-foreground">
                Response
              </h3>
              {response && !response.error && (
                <div className="flex items-center gap-3">
                  <StatusBadge
                    status={response.status}
                    statusText={response.statusText}
                  />
                  <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {response.time}ms
                  </span>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        JSON.stringify(response.data, null, 2)
                      )
                    }
                    className="flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>
                </div>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-5">
              {!response ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-3 rounded-full bg-muted p-3">
                    <FileJson className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    No response yet
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                    Configure your request on the left and click{" "}
                    <span className="font-medium text-foreground">
                      Send Request
                    </span>{" "}
                    to see the API response here.
                  </p>
                </div>
              ) : response.error ? (
                <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      Request Failed
                    </p>
                    <p className="mt-1 text-xs text-destructive/90">
                      {response.error}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-border bg-muted/40">
                  <pre className="overflow-auto p-4 font-mono text-xs leading-relaxed text-foreground">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}