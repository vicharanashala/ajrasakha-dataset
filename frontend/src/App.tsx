import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
  useSearchParams,
} from "react-router-dom";
import { SignUp } from "./pages/SignUp";
import { SignIn } from "./pages/SignIn";
import { VerifyOtp } from "./pages/VerifyOtp";
import { Questions } from "./pages/Questions";
import { QuestionDetail } from "./pages/QuestionDetail";
import { Profile } from "./pages/Profile";
import { MyFeedbacks } from "./pages/MyFeedbacks";
import type { User } from "./types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sun, Moon, User as UserIcon, MessageCircle, ChevronDown } from "lucide-react";
import { getToken, clearAuth, setToken, setUser } from "./services/api";


const USER_STORAGE_KEY = "ajrasakha_user";

// Protected route wrapper - redirects to signin if not authenticated
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();
  if (!token) {
    return <Navigate to="/signin" replace />;
  }
  return <>{children}</>;
}


// Layout wrapper for protected routes (with header and user menu)
function ProtectedLayout() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleSignOut = () => {
    clearAuth();
    setShowLogoutDialog(false);
    window.location.href = '/signin';
  };


  const navigate = useNavigate();

  return (
    <>
      {/* Protected Routes with Header */}
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-10 border-b border-border bg-card shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3 h-10">
              <img
                src="/annam-logo.png"
                alt="Annam Logo"
                className="h-10 w-auto"
              />
              <h1 className="text-xl font-bold tracking-tight text-foreground leading-tight">
                Ajrasakha Dataset
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
                aria-label="Toggle theme"
              >
                {isDarkMode ? (
                  <Sun className="h-4 w-4 text-foreground" />
                ) : (
                  <Moon className="h-4 w-4 text-foreground" />
                )}
              </button>
              {/* User Menu Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="gap-2"
                >
                  <UserIcon className="h-4 w-4" />
                  {(() => {
                    const stored = localStorage.getItem(USER_STORAGE_KEY);
                    if (stored) {
                      const user = JSON.parse(stored);
                      return user?.firstName || user?.email?.split("@")[0] || "User";
                    }
                    return "User";
                  })()}
                  <ChevronDown className="h-4 w-4" />
                </Button>
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            navigate("/profile");
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                        >
                          <UserIcon className="h-4 w-4" />
                          Profile
                        </button>
                        <button
                          onClick={() => {
                            navigate("/my-feedbacks");
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          My Feedbacks
                        </button>
                        <hr className="my-1 border-border" />
                        <button
                          onClick={() => {
                            setShowLogoutDialog(true);
                            setShowUserMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted text-destructive flex items-center gap-2"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<Navigate to="/questions" replace />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/questions/:id" element={<QuestionDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-feedbacks" element={<MyFeedbacks />} />
          </Routes>
        </main>
        <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign Out
            </Button>
          </DialogFooter>
        </Dialog>
      </div>
    </>
  );
}

// Handle Google OAuth redirect
function GoogleAuthSuccess() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      window.location.href = '/signin?error=google_auth_failed';
      return;
    }

    if (token && userId && email) {
      // Store token and user data
      setToken(token);
      const user = {
        id: userId,
        email: decodeURIComponent(email),
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      // Redirect to questions page
      window.location.href = '/questions';
    } else {
      window.location.href = '/signin?error=invalid_google_response';
    }
  }, []);

  // Show loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completing Google sign in...</p>
      </div>
    </div>
  );
}

// Auth layout with header (no user menu)
function AuthLayout() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3 h-10">
            <img
              src="/annam-logo.png"
              alt="Annam Logo"
              className="h-10 w-auto"
            />
            <h1 className="text-xl font-bold tracking-tight text-foreground leading-tight">
              Ajrasakha Dataset
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Farmer-Centric Dataset
            </span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md border border-border hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4 text-foreground" />
              ) : (
                <Moon className="h-4 w-4 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Routes>
          <Route path="/signin" element={<SignInWrapper />} />
          <Route path="/signup" element={<SignUpWrapper />} />
          <Route path="/verify-otp" element={<VerifyOtpWrapper />} />
          <Route path="/auth-success" element={<GoogleAuthSuccess />} />
        </Routes>
      </main>
    </div>
  );
}


// Wrapper components for auth pages
function SignInWrapper() {
  const token = getToken();
  if (token) {
    return <Navigate to="/questions" replace />;
  }

  const handleSignedIn = (user: User, token: string) => {
    setToken(token);
    setUser(user);
    window.location.href = '/questions';
  };

  return <SignIn onSwitchToSignUp={() => window.location.href = '/signup'} onSignedIn={handleSignedIn} />;
}


function SignUpWrapper() {
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  if (storedUser) {
    return <Navigate to="/questions" replace />;
  }

  const handleSignupSuccess = (email: string) => {
    localStorage.setItem('ajrasakha_pending_email', email);
    window.location.href = '/verify-otp';
  };

  return <SignUp onSwitchToSignIn={() => window.location.href = '/signin'} onSignupSuccess={handleSignupSuccess} />;
}

function VerifyOtpWrapper() {
  const pendingEmail = localStorage.getItem('ajrasakha_pending_email') || '';

  const handleVerified = (user: { id: string; email: string }, token?: string) => {
    localStorage.removeItem('ajrasakha_pending_email');
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
      ...user,
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    // Store JWT token if provided
    if (token) {
      setToken(token);
    }
    window.location.href = '/questions';
  };


  if (!pendingEmail) {
    return <Navigate to="/signup" replace />;
  }

  return <VerifyOtp email={pendingEmail} onVerified={handleVerified} onBack={() => window.location.href = '/signup'} />;
}


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Google OAuth callback - must be outside AuthLayout to work */}
        <Route path="/auth-success" element={<GoogleAuthSuccess />} />

        {/* Auth routes without header */}
        <Route element={<AuthLayout />}>
          <Route path="/signin" element={<SignInWrapper />} />
          <Route path="/signup" element={<SignUpWrapper />} />
          <Route path="/verify-otp" element={<VerifyOtpWrapper />} />
        </Route>

        {/* Protected routes with header - all require authentication */}
        <Route element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/questions" replace />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/questions/:id" element={<QuestionDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-feedbacks" element={<MyFeedbacks />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;