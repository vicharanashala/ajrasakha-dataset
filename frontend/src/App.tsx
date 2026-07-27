import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
  useSearchParams,
  Outlet,
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
import { Sun, Moon, User as UserIcon, MessageCircle, ChevronDown, LogOut } from "lucide-react";
import { getToken, clearAuth, setToken, setUser } from "./services/api";


// Common Header Component
interface HeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  showUserMenu?: boolean;
  onShowUserMenu?: boolean;
  onToggleUserMenu?: () => void;
  onNavigate?: (path: string) => void;
  onSignOut?: () => void;
  showLogoutDialog?: boolean;
  onShowLogoutDialog?: (show: boolean) => void;
}

function Header({
  isDarkMode,
  onToggleTheme,
  showUserMenu,
  onToggleUserMenu,
  onNavigate,
  onSignOut,
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
      <div className="relative flex items-center justify-between px-6 py-2.5">
        {/* Logo - left corner */}
        <div className="flex items-center gap-3 h-12">
          <img src="/annam-logo.png" alt="Annam Logo" className="h-12 w-auto" />
        </div>

        {/* Title - absolutely centered */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-lg sm:text-xl font-bold tracking-wide uppercase text-foreground leading-tight whitespace-nowrap">
          Ajrasakha Dataset
        </h1>

        {/* Theme + Profile - right corner */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* User Menu Dropdown - only shown when user is logged in */}
          {onToggleUserMenu && onNavigate && onSignOut && (
            <div className="relative">
              <Button
                variant="outline"
                onClick={onToggleUserMenu}
                className="gap-2 pl-2.5 pr-3"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserIcon className="h-3.5 w-3.5" />
                </span>
                <span className="max-w-[100px] truncate">
                  {(() => {
                    const stored = localStorage.getItem(USER_STORAGE_KEY);
                    if (stored) {
                      const user = JSON.parse(stored);
                      return (
                        user?.firstName || user?.email?.split("@")[0] || "User"
                      );
                    }
                    return "User";
                  })()}
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => onToggleUserMenu()}
                  />
                  <div className="absolute right-0 mt-2 w-52 origin-top-right animate-in fade-in-0 zoom-in-95 rounded-lg border border-border bg-card shadow-lg z-50 overflow-hidden">
                    <div className="py-1.5">
                      <button
                        onClick={() => {
                          navigate("/profile");
                          onToggleUserMenu();
                        }}
                        className="w-full px-3.5 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors"
                      >
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          navigate("/my-feedbacks");
                          onToggleUserMenu();
                        }}
                        className="w-full px-3.5 py-2 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors"
                      >
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        My Feedbacks
                      </button>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={() => {
                          onSignOut();
                          onToggleUserMenu();
                        }}
                        className="w-full px-3.5 py-2 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2.5 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

const USER_STORAGE_KEY = "ajrasakha_user";

// Protected route wrapper - redirects to signin if not authenticated
function ProtectedRoute() {
  const token = getToken();
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  
  // Redirect to signin if not authenticated (no token AND no stored user)
  if (!token && !storedUser) {
    return <Navigate to="/signin" replace />;
  }
  return <Outlet />;
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

  const navigate = useNavigate();

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleSignOut = () => {
    clearAuth();
    setShowLogoutDialog(false);
    navigate('/signin');
  };

  return (
    <>
      <div className="flex min-h-screen flex-col bg-background">
        <Header
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          showUserMenu={showUserMenu}
          onToggleUserMenu={() => setShowUserMenu(!showUserMenu)}
          onNavigate={(path) => navigate(path)}
          onSignOut={() => setShowLogoutDialog(true)}
        />
        <main className="flex-1 w-full">
          <Outlet />
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
      <Header
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />
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
  const navigate = useNavigate();
  const token = getToken();
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  
  // Redirect to questions if already authenticated (either token or storedUser)
  if (token || storedUser) {
    return <Navigate to="/questions" replace />;
  }

  const handleSignedIn = (user: User, token: string) => {
    setToken(token);
    setUser(user);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({
      ...user,
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    navigate('/questions');
  };

  return <SignIn onSwitchToSignUp={() => navigate('/signup')} onSignedIn={handleSignedIn} />;
}


function SignUpWrapper() {
  const navigate = useNavigate();
  const token = getToken();
  const storedUser = localStorage.getItem(USER_STORAGE_KEY);
  
  // Redirect to questions if already authenticated
  if (token || storedUser) {
    return <Navigate to="/questions" replace />;
  }

  const handleSignupSuccess = (email: string) => {
    localStorage.setItem('ajrasakha_pending_email', email);
    navigate('/verify-otp');
  };

  return <SignUp onSwitchToSignIn={() => navigate('/signin')} onSignupSuccess={handleSignupSuccess} />;
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
        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Navigate to="/questions" replace />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/questions/:id" element={<QuestionDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-feedbacks" element={<MyFeedbacks />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;