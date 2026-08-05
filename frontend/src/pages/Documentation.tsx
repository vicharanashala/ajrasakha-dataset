import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  apiKeyService,
  publicDatasetService,
  type AvailableFilters,
  type ApiKeyListItem,
  type ApiKeyInfo,
} from "../services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ToastContainer, useToast } from "@/components/ui/toast";
import {
  Key,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Hash,
  MapPin,
  Terminal,
  RefreshCw,
  ArrowLeft,
  ArrowUpRight,
  TriangleAlert,
} from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

function CopyButton({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-1.5 rounded-md hover:bg-muted transition-colors ${className}`}
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}

interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  values: string[];
  loading?: boolean;
}

function FilterSection({ title, icon, values, loading }: FilterSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const displayValues = expanded ? values : values.slice(0, 15);
  const hasMore = values.length > 15;

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </div>
        <div className="flex flex-wrap gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-6 w-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
        <span className="text-xs text-muted-foreground ml-1">
          ({values.length})
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {displayValues.map((v) => (
          <span
            key={v}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground"
          >
            {v}
          </span>
        ))}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {expanded ? (
              <>
                <ChevronDown className="h-3 w-3" />
                Show less
              </>
            ) : (
              <>
                <ChevronRight className="h-3 w-3" />+{values.length - 15} more
              </>
            )}
          </button>
        )}
      </div>
      {values.length === 0 && (
        <p className="text-xs text-muted-foreground">No values available</p>
      )}
    </div>
  );
}

function maskApiKey(key: string): string {
  if (key.length <= 12) return "***";
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
}

function ApiKeyGeneratedModal({
  apiKey,
  open,
  onClose,
}: {
  apiKey: ApiKeyInfo;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Check className="h-5 w-5 text-green-500" />
          API Key Generated
        </DialogTitle>
        <DialogDescription className="pt-1">
          Copy and store this key securely now — it will never be displayed again.
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-4 py-3 my-4">
        <code className="flex-1 text-sm font-mono text-foreground break-all">
          {maskApiKey(apiKey.key)}
        </code>
        <CopyButton text={apiKey.key} />
      </div>
      <DialogFooter>
        <Button onClick={onClose}>Done</Button>
      </DialogFooter>
    </Dialog>
  );
}

const NAV_SECTIONS = [
  { id: "api-keys", label: "API Keys" },
  { id: "endpoint", label: "Endpoint" },
  { id: "auth", label: "Authentication" },
  { id: "params", label: "Query Parameters" },
  { id: "examples", label: "Example Requests" },
  { id: "response", label: "Response Shape" },
  { id: "filters", label: "Available Filters" },
];

function SectionNav({ activeSection }: { activeSection: string | null }) {
  const scrollTo = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav className="hidden lg:block sticky top-6 self-start w-56 shrink-0 space-y-6">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-2 mb-2">
          On this page
        </p>
        {NAV_SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollTo(s.id)}
            className={`block w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors ${
              activeSection === s.id
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function Documentation() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKeyListItem[]>([]);
  const [keyTab, setKeyTab] = useState<"active" | "inactive">("active");
  const [newKey, setNewKey] = useState<ApiKeyInfo | null>(null);
  const [newKeyModalOpen, setNewKeyModalOpen] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [filters, setFilters] = useState<AvailableFilters | null>(null);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [filtersError, setFiltersError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<{ id: string; name?: string } | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>("api-keys");


  const fetchApiKeys = useCallback(async () => {
    setLoadingKeys(true);
    try {
      const keys = await apiKeyService.list();
      setApiKeys(keys);
      setKeyError(null);
    } catch {
      setKeyError("Failed to load API keys");
    } finally {
      setLoadingKeys(false);
    }
  }, []);

  const fetchFilters = useCallback(async (apiKey: string) => {
    setFiltersLoading(true);
    setFiltersError(null);
    try {
      const data = await publicDatasetService.getFilters(apiKey);
      setFilters(data);
    } catch {
      setFiltersError("Failed to load filter values");
    } finally {
      setFiltersLoading(false);
    }
  }, []);

  // Fetch API keys + available filter options on mount
  useEffect(() => {
    fetchApiKeys();
    // Load filters without needing an API key
    publicDatasetService
      .getAvailableFilters()
      .then(setFilters)
      .catch(() => {}); // silent fail — filters are a nice-to-have
  }, [fetchApiKeys]);

  // Scroll-spy: highlight sidebar nav item based on which section is in view
  useEffect(() => {
    const sectionIds = NAV_SECTIONS.map((s) => s.id);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleGenerateKey = async () => {
    if (apiKeys.filter((k) => k.isActive).length >= 5) {
      addToast(
        "You have reached the maximum of 5 active API keys. Revoke an existing key before creating a new one.",
        "error"
      );
      return;
    }
    setGenerating(true);
    setKeyError(null);
    try {
      const key = await apiKeyService.generate(keyName || undefined);
      setNewKey(key);
      setNewKeyModalOpen(true);
      setActiveKey(key.key);
      setFilters({ states: [] });
      // Refresh key list
      await fetchApiKeys();
      setKeyName("");
    } catch {
      setKeyError("Failed to generate API key. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const openConfirmRevoke = (id: string, name?: string) => {
    setKeyToRevoke({ id, name });
    setConfirmDialogOpen(true);
  };

  const handleConfirmRevoke = async () => {
    if (!keyToRevoke) return;
    setRevokingId(keyToRevoke.id);
    setConfirmDialogOpen(false);
    try {
      await apiKeyService.revoke(keyToRevoke.id);
      if (activeKey === keyToRevoke.id) setActiveKey(null);
      await fetchApiKeys();
    } catch {
      setKeyError("Failed to revoke API key");
    } finally {
      setRevokingId(null);
      setKeyToRevoke(null);
    }
  };

  const apiUrl = (() => {
    const base = import.meta.env.VITE_API_URL || "";
    return `${base}/public/questions`;
  })();

  return (
    <div className="w-full px-6 lg:px-10 py-8">
      <div className="w-full max-w-[1400px] mx-auto">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Documentation</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Ajrasakha Dataset API
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-2xl">
              Access the curated agricultural Q&amp;A dataset programmatically
              via REST API.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/questions")}
            className="shrink-0 gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Questions
          </Button>
        </div>

        {/* Error Alert */}
        {keyError && (
          <Alert variant="destructive" className="border-destructive/50 mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{keyError}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-10">
          <SectionNav activeSection={activeSection} />

          <div className="flex-1 min-w-0 space-y-8">
            {/* API Key Section */}
            <Card
              id="api-keys"
              className="shadow-sm border-border/50 scroll-mt-6"
            >
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Keys
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generate an API key to authenticate your requests. Keys are
                  shown only once at creation.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">


                {/* Generate new key */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Key name (optional, e.g. 'production-app')"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerateKey()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleGenerateKey}
                    disabled={generating || apiKeys.filter((k) => k.isActive).length >= 5}
                    className="shrink-0"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Generating
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Key
                      </>
                    )}
                  </Button>
                </div>

                {/* Existing keys list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Your API Keys</p>
                    {/* Tabs */}
                    <div className="flex items-center rounded-md border border-border bg-muted/50 p-0.5 gap-0.5">
                      <button
                        onClick={() => setKeyTab("active")}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          keyTab === "active"
                            ? "bg-background text-foreground shadow-sm font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => setKeyTab("inactive")}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          keyTab === "inactive"
                            ? "bg-background text-foreground shadow-sm font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        Inactive
                      </button>
                    </div>
                  </div>
                  {keyTab === "active" && apiKeys.filter((k) => k.isActive).length >= 5 && (
                    <p className="text-xs text-orange-500">
                      Maximum of 5 active API keys reached. Revoke an existing key to
                      create a new one.
                    </p>
                  )}
                  {loadingKeys ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[...Array(2)].map((_, i) => (
                        <div
                          key={i}
                          className="h-14 bg-muted rounded-lg animate-pulse"
                        />
                      ))}
                    </div>
                  ) : (
                    keyTab === "active"
                      ? apiKeys.filter((k) => k.isActive)
                      : apiKeys.filter((k) => !k.isActive)
                  ).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                      {keyTab === "active"
                        ? "No active API keys. Generate one above to get started."
                        : "No inactive API keys."}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {(keyTab === "active"
                        ? apiKeys.filter((k) => k.isActive)
                        : apiKeys.filter((k) => !k.isActive)
                      ).map((k) => (
                        <div
                          key={k.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`shrink-0 w-2 h-2 rounded-full ${k.isActive ? "bg-green-500" : "bg-muted-foreground"}`}
                            />
                            <div className="min-w-0">
                              {k.name && (
                                <p className="text-sm font-medium truncate">
                                  {k.name}
                                </p>
                              )}
                              <p className="text-xs font-mono text-muted-foreground">
                                {k.keyPreview}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Created{" "}
                                {new Date(k.createdAt).toLocaleDateString()}
                                {k.lastUsedAt &&
                                  ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                          {k.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openConfirmRevoke(k.id, k.name)}
                              disabled={revokingId === k.id}
                              className="text-destructive hover:text-destructive shrink-0"
                            >
                              {revokingId === k.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Endpoint Documentation */}
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  API Endpoint
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Endpoint URL */}
                <div id="endpoint" className="space-y-2 scroll-mt-6">
                  <p className="text-sm font-medium">Request URL</p>
                  <div className="flex items-center gap-2 bg-muted rounded-md px-4 py-3 font-mono text-sm break-all">
                    <span className="text-primary font-semibold">GET</span>
                    <span className="text-foreground">{apiUrl}</span>
                    <CopyButton text={apiUrl} className="shrink-0" />
                  </div>
                </div>

                {/* Authentication */}
                <div id="auth" className="space-y-2 scroll-mt-6">
                  <p className="text-sm font-medium">Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Pass your API key as a Bearer token in the{" "}
                    <code className="px-1 py-0.5 bg-muted rounded text-xs">
                      Authorization
                    </code>{" "}
                    header:
                  </p>
                  <div className="bg-muted rounded-md px-4 py-3 font-mono text-sm">
                    <p>
                      Authorization: Bearer{" "}
                      <span className="text-primary">YOUR_API_KEY</span>
                    </p>
                  </div>
                </div>

                {/* Query Parameters */}
                <div id="params" className="space-y-3 scroll-mt-6">
                  <p className="text-sm font-medium">Query Parameters</p>
                  <div className="overflow-x-auto rounded-md border border-border">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">
                            Parameter
                          </th>
                          <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">
                            Type
                          </th>
                          <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">
                            Default
                          </th>
                          <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        {[
                          {
                            param: "page",
                            type: "integer",
                            def: "1",
                            desc: "Page number (1-indexed)",
                          },
                          {
                            param: "limit",
                            type: "integer",
                            def: "20",
                            desc: "Results per page (max 100)",
                          },
                          {
                            param: "state",
                            type: "string",
                            def: "—",
                            desc: "Filter by Indian state",
                          },
                        ].map((row, i, arr) => (
                          <tr
                            key={row.param}
                            className={
                              i < arr.length - 1 ? "border-b border-border" : ""
                            }
                          >
                            <td className="py-2.5 px-4 font-mono text-xs text-foreground whitespace-nowrap">
                              {row.param}
                            </td>
                            <td className="py-2.5 px-4 whitespace-nowrap">
                              {row.type}
                            </td>
                            <td className="py-2.5 px-4 whitespace-nowrap">
                              {row.def}
                            </td>
                            <td className="py-2.5 px-4">{row.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Example Requests */}
                <div id="examples" className="space-y-3 scroll-mt-6">
                  <p className="text-sm font-medium">Example Requests</p>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {[
                      {
                        label: "Get all questions (first page)",
                        code: `curl -H "Authorization: Bearer YOUR_API_KEY" "${apiUrl}?page=1&limit=20"`,
                      },
                      {
                        label: "Filter by state and crop",
                        code: `curl -H "Authorization: Bearer YOUR_API_KEY" "${apiUrl}?state=Maharashtra&crop=Rice"`,
                      },
                      {
                        label: "Filter by multiple params",
                        code: `curl -H "Authorization: Bearer YOUR_API_KEY" "${apiUrl}?state=Uttar%20Pradesh&crop=Wheat&limit=50"`,
                      },
                    ].map((ex) => (
                      <div key={ex.label} className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          {ex.label}
                        </p>
                        <div className="flex items-start gap-2 bg-muted rounded-md px-4 py-3 font-mono text-xs break-all">
                          <code className="text-foreground whitespace-pre-wrap flex-1">
                            {ex.code}
                          </code>
                          <CopyButton
                            text={ex.code}
                            className="shrink-0 mt-0.5"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Response Shape */}
                <div id="response" className="space-y-3 scroll-mt-6">
                  <p className="text-sm font-medium">Response Shape</p>
                  <pre className="bg-muted rounded-md px-4 py-3 font-mono text-xs overflow-x-auto text-foreground">{`{
  "data": [
    {
      "question": "string",
      "details": {
        "state": "Maharashtra",
        "district": "Pune",
        "crop": "Cotton",
        "season": "Kharif",
        "domain": ["pest", "irrigation"]
      },
      "answer": {
        "answer": "string",
        "sources": [{ "source": "url", "sourceType": "web", "sourceName": "..." }]
      },
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "total": 1000,
  "page": 1,
  "limit": 20,
  "totalPages": 50
}`}</pre>
                </div>

                {/* Available Filters */}
                <div id="filters" className="space-y-3 scroll-mt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      Available Filter Values
                    </p>
                    {activeKey && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fetchFilters(activeKey)}
                        className="text-xs"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Refresh
                      </Button>
                    )}
                  </div>
                  {!filters && !filtersError ? (
                    <p className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-lg">
                      Loading available filter values...
                    </p>
                  ) : filtersLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                          <div className="flex flex-wrap gap-2">
                            {[...Array(8)].map((_, j) => (
                              <div
                                key={j}
                                className="h-6 w-20 bg-muted rounded-full animate-pulse"
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filtersError ? (
                    <Alert
                      variant="destructive"
                      className="border-destructive/50 py-2"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {filtersError}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    filters && (
                      <FilterSection
                        title="States"
                        icon={<MapPin className="h-4 w-4" />}
                        values={filters.states}
                      />
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* API Key Generated Modal */}
            {newKey && (
              <ApiKeyGeneratedModal
                apiKey={newKey}
                open={newKeyModalOpen}
                onClose={() => setNewKeyModalOpen(false)}
              />
            )}

            {/* Revoke Confirmation Dialog */}
            <Dialog
              open={confirmDialogOpen}
              onOpenChange={(open) => {
                setConfirmDialogOpen(open);
                if (!open) setKeyToRevoke(null);
              }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TriangleAlert className="h-5 w-5 text-destructive" />
                  Revoke API Key
                </DialogTitle>
                <DialogDescription>
                  Are you sure you want to revoke{" "}
                  <span className="font-medium text-foreground">
                    {keyToRevoke?.name
                      ? `"${keyToRevoke.name}"`
                      : apiKeys.find((k) => k.id === keyToRevoke?.id)?.keyPreview ??
                        "this API key"}
                  </span>
                  ? This action cannot be undone and any application using this key
                  will lose access immediately.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmDialogOpen(false);
                    setKeyToRevoke(null);
                  }}
                  disabled={revokingId !== null}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmRevoke}
                  disabled={revokingId !== null}
                >
                  {revokingId !== null ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Revoke Key
                </Button>
              </DialogFooter>
            </Dialog>

            {/* Footer link */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 pb-8">
              <span>Ajrasakha Dataset API</span>
              <a
                href="#endpoint"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById("endpoint")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Back to top
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
