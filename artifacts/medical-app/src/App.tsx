import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { ThemeProvider } from "@/context/ThemeContext";
import SplashScreen from "@/components/SplashScreen";
import HomePage from "@/pages/HomePage";
import ChatbotPage from "@/pages/ChatbotPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import DashboardPage from "@/pages/DashboardPage";
import PostDetailPage from "@/pages/PostDetailPage";
import ProfilePage from "@/pages/ProfilePage";
import MessagesPage from "@/pages/MessagesPage";
import AdminPage from "@/pages/AdminPage";
import SettingsPage from "@/pages/SettingsPage";
import CommunityPage from "@/pages/CommunityPage";
import CreatePostPage from "@/pages/CreatePostPage";
import FlashcardsPage from "@/pages/FlashcardsPage";
import QuizPage from "@/pages/QuizPage";
import NotesPage from "@/pages/NotesPage";
import PastQuestionsPage from "@/pages/PastQuestionsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import GroupsPage from "@/pages/GroupsPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

function ProtectedRoute({ component: Component, isAuthenticated, isLoading }: ProtectedRouteProps) {
  if (isLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          border: "3px solid var(--border)",
          borderTop: "3px solid #0D9488",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router({ isAuthenticated, isLoading }: { isAuthenticated: boolean; isLoading: boolean }) {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={LoginPage} />
      <Route path="/signup" component={SignupPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />

      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute component={HomePage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/feed">
        <ProtectedRoute component={HomePage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardPage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/chatbot">
        <ProtectedRoute component={ChatbotPage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/post/:id">
        <ProtectedRoute component={PostDetailPage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/profile/:username">
        <ProtectedRoute component={ProfilePage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/messages">
        <ProtectedRoute component={MessagesPage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/notifications">
        <ProtectedRoute component={NotificationsPage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/groups">
        <ProtectedRoute component={GroupsPage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={AdminPage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/settings">
        <ProtectedRoute component={SettingsPage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/c/:slug">
        <ProtectedRoute component={CommunityPage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/community/:slug">
        <ProtectedRoute component={CommunityPage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/create">
        <ProtectedRoute component={CreatePostPage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/create-post">
        <ProtectedRoute component={CreatePostPage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/flashcards">
        <ProtectedRoute component={FlashcardsPage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/quiz">
        <ProtectedRoute component={QuizPage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/notes">
        <ProtectedRoute component={NotesPage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>
      <Route path="/past-questions">
        <ProtectedRoute component={PastQuestionsPage} isAuthenticated={isAuthenticated} isLoading={isLoading} />
      </Route>

      {/* 404 fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [splashDone, setSplashDone] = useState(
    () => sessionStorage.getItem("splashShown") === "true"
  );

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session?.user);
      } catch (err) {
        console.error("Auth check error:", err);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription?.unsubscribe();
  }, []);

  if (!splashDone) {
    return (
      <SplashScreen
        onComplete={() => {
          sessionStorage.setItem("splashShown", "true");
          setSplashDone(true);
        }}
      />
    );
  }

  return <Router isAuthenticated={isAuthenticated} isLoading={isLoading} />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppContent />
        </WouterRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;