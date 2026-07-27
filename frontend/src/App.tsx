import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { SignUp } from "./pages/SignUp";
import { SignIn } from "./pages/SignIn";
import { VerifyOtp } from "./pages/VerifyOtp";
import { Questions } from "./pages/Questions";
import { QuestionDetail } from "./pages/QuestionDetail";
import { Profile } from "./pages/Profile";
import { MyFeedbacks } from "./pages/MyFeedbacks";
import type { AuthView, User } from "./types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sun, Moon, User as UserIcon, Menu, MessageCircle, ChevronDown } from "lucide-react";

const USER_STORAGE_KEY = "ajrasakha_user";

function AppContent() {
  const [view, setView] = useState<AuthView>("signin");
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, [currentUser]);

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

  const handleSignupSuccess = (email: string) => {
    setPendingEmail(email);
    setView("verify-otp");
  };

  const handleVerified = (user: { id: string; email: string }) => {
    setCurrentUser({
      id: user.id,
      email: user.email,
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setView("signin");
    setPendingEmail("");
  };

  const handleSignedIn = (user: User) => {
    setCurrentUser(user);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setView("signin");
    setShowLogoutDialog(false);
  };

  // Add useNavigate for navigation
  const navigate = useNavigate();
  const location = useLocation();

  if (currentUser) {
    return (
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
                  {currentUser?.firstName || currentUser?.email?.split("@")[0] || "User"}
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
            <Route path="/" element={<Questions />} />
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
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/annam-logo.png"
              alt="Annam Logo"
              className="h-8 w-auto"
            />
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Ajrasakha
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
        {view === "signin" && (
          <SignIn
            onSwitchToSignUp={() => setView("signup")}
            onSignedIn={handleSignedIn}
          />
        )}
        {view === "signup" && (
          <SignUp
            onSwitchToSignIn={() => setView("signin")}
            onSignupSuccess={handleSignupSuccess}
          />
        )}
        {view === "verify-otp" && (
          <VerifyOtp
            email={pendingEmail}
            onVerified={handleVerified}
            onBack={() => setView("signup")}
          />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
