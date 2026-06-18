import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import {
  Flame,
  BookOpen,
  Trophy,
  Clock,
  Zap,
  TrendingUp,
  Calendar,
  ChevronRight,
  Star,
  Target,
  Activity,
  GraduationCap,
  Brain,
  MessageSquare,
  Bell,
  ArrowUpRight,
  Pencil,
  Newspaper,
} from "lucide-react";
import AnimatedPage from "@/components/animations/AnimatedPage";
import StaggerChildren from "@/components/animations/StaggerChildren";

interface UserStats {
  streak_days: number;
  total_quizzes_taken: number;
  average_score: number;
  flashcards_reviewed: number;
  study_minutes_today: number;
  total_study_minutes: number;
  posts_created: number;
  communities_joined: number;
}

interface RecentActivity {
  id: string;
  type: "quiz" | "flashcard" | "post" | "note" | "community";
  title: string;
  timestamp: string;
  score?: number;
}

interface UpcomingTask {
  id: string;
  title: string;
  due_date: string;
  type: "quiz" | "deadline" | "study";
  completed: boolean;
}

interface DailyQuote {
  text: string;
  author: string;
}

const MEDICAL_QUOTES: DailyQuote[] = [
  { text: "The good physician treats the disease; the great physician treats the patient who has the disease.", author: "William Osler" },
  { text: "Wherever the art of Medicine is loved, there is also a love of Humanity.", author: "Hippocrates" },
  { text: "The greatest medicine of all is to teach people how not to need it.", author: "Hippocrates" },
  { text: "To study the phenomena of disease without books is to sail an uncharted sea.", author: "William Osler" },
  { text: "Medicine is a science of uncertainty and an art of probability.", author: "William Osler" },
];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<UserStats>({
    streak_days: 0,
    total_quizzes_taken: 0,
    average_score: 0,
    flashcards_reviewed: 0,
    study_minutes_today: 0,
    total_study_minutes: 0,
    posts_created: 0,
    communities_joined: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayQuote, setTodayQuote] = useState<DailyQuote>(MEDICAL_QUOTES[0]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Get today's quote (same quote all day)
  useEffect(() => {
    const dayOfYear = Math.floor(
      (currentTime.getTime() - new Date(currentTime.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    setTodayQuote(MEDICAL_QUOTES[dayOfYear % MEDICAL_QUOTES.length]);
  }, []);

  // Fetch all dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);

        // Get current user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          navigate("/login");
          return;
        }
        setUser(authUser);

        // Get profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();
        setProfile(profileData);

        // Fetch stats in parallel
        const [
          quizResult,
          flashcardResult,
          postsResult,
          communitiesResult,
          studyResult,
        ] = await Promise.all([
          // Quiz stats
          supabase
            .from("quiz_attempts")
            .select("score, created_at")
            .eq("user_id", authUser.id)
            .order("created_at", { ascending: false }),

          // Flashcard reviews
          supabase
            .from("flashcard_reviews")
            .select("created_at")
            .eq("user_id", authUser.id)
            .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

          // Posts created
          supabase
            .from("posts")
            .select("id", { count: "exact", head: true })
            .eq("author_id", authUser.id),

          // Communities joined
          supabase
            .from("community_members")
            .select("id", { count: "exact", head: true })
            .eq("user_id", authUser.id),

          // Study sessions
          supabase
            .from("study_sessions")
            .select("duration_minutes, created_at")
            .eq("user_id", authUser.id)
            .order("created_at", { ascending: false })
            .limit(30),
        ]);

        // Calculate stats
        const quizScores = quizResult.data?.map((q: any) => q.score) || [];
        const avgScore = quizScores.length > 0
          ? Math.round(quizScores.reduce((a: number, b: number) => a + b, 0) / quizScores.length)
          : 0;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStudyMinutes = studyResult.data
          ?.filter((s: any) => new Date(s.created_at) >= todayStart)
          .reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0) || 0;

        const totalStudyMinutes = studyResult.data
          ?.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0) || 0;

        // Calculate streak (consecutive days with activity)
        const allActivityDates = new Set<string>();
        quizResult.data?.forEach((q: any) => allActivityDates.add(q.created_at.split("T")[0]));
        flashcardResult.data?.forEach((f: any) => allActivityDates.add(f.created_at.split("T")[0]));
        studyResult.data?.forEach((s: any) => allActivityDates.add(s.created_at.split("T")[0]));

        const sortedDates = Array.from(allActivityDates).sort().reverse();
        let streak = 0;
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

        if (sortedDates[0] === today || sortedDates[0] === yesterday) {
          streak = 1;
          for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            const diffDays = (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays === 1) {
              streak++;
            } else {
              break;
            }
          }
        }

        setStats({
          streak_days: streak,
          total_quizzes_taken: quizResult.data?.length || 0,
          average_score: avgScore,
          flashcards_reviewed: flashcardResult.data?.length || 0,
          study_minutes_today: todayStudyMinutes,
          total_study_minutes: totalStudyMinutes,
          posts_created: postsResult.count || 0,
          communities_joined: communitiesResult.count || 0,
        });

        // Build recent activity
        const activity: RecentActivity[] = [];

        quizResult.data?.slice(0, 3).forEach((q: any) => {
          activity.push({
            id: `quiz-${q.created_at}`,
            type: "quiz",
            title: "Completed a quiz",
            timestamp: q.created_at,
            score: q.score,
          });
        });

        // Get recent posts
        const { data: recentPosts } = await supabase
          .from("posts")
          .select("title, created_at")
          .eq("author_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(2);

        recentPosts?.forEach((p: any) => {
          activity.push({
            id: `post-${p.created_at}`,
            type: "post",
            title: p.title || "Created a post",
            timestamp: p.created_at,
          });
        });

        // Get recent notes
        const { data: recentNotes } = await supabase
          .from("notes")
          .select("title, created_at")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(2);

        recentNotes?.forEach((n: any) => {
          activity.push({
            id: `note-${n.created_at}`,
            type: "note",
            title: `Note: ${n.title || "Untitled"}`,
            timestamp: n.created_at,
          });
        });

        // Sort by timestamp
        activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentActivity(activity.slice(0, 5));

        // Fetch upcoming tasks (mock data if no tasks table — you can replace with real data)
        const mockTasks: UpcomingTask[] = [
          {
            id: "1",
            title: "Anatomy Quiz - Cardiovascular System",
            due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
            type: "quiz",
            completed: false,
          },
          {
            id: "2",
            title: "Review Pathology Notes",
            due_date: new Date(Date.now() + 86400000 * 3).toISOString(),
            type: "study",
            completed: false,
          },
          {
            id: "3",
            title: "Community Post Deadline",
            due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
            type: "deadline",
            completed: false,
          },
        ];
        setUpcomingTasks(mockTasks);

      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getDaysOfWeek = () => {
    const today = currentTime.getDay();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayIndex = (today - 3 + i + 7) % 7;
      const date = new Date(currentTime);
      date.setDate(date.getDate() - 3 + i);
      days.push({
        name: SHORT_DAYS[dayIndex],
        date: date.getDate(),
        isToday: i === 3,
        isPast: i < 3,
      });
    }
    return days;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "quiz": return <Brain size={16} />;
      case "flashcard": return <BookOpen size={16} />;
      case "post": return <MessageSquare size={16} />;
      case "note": return <BookOpen size={16} />;
      case "community": return <GraduationCap size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "quiz": return "#8B5CF6";
      case "flashcard": return "#10B981";
      case "post": return "#3B82F6";
      case "note": return "#F59E0B";
      case "community": return "#EC4899";
      default: return "#6B7280";
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <AnimatedPage>
        <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "16px",
            animation: "pulse 1.5s infinite"
          }}>
            <div style={{ height: "80px", background: "var(--surface)", borderRadius: "16px" }} />
            <div style={{ height: "120px", background: "var(--surface)", borderRadius: "16px" }} />
            <div style={{ height: "200px", background: "var(--surface)", borderRadius: "16px" }} />
          </div>
        </div>
      </AnimatedPage>
    );
  }

  const weekDays = getDaysOfWeek();

  return (
    <AnimatedPage>
      <div style={{ padding: "16px", paddingBottom: "80px", maxWidth: "800px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ 
            fontSize: "28px", 
            fontWeight: 700, 
            color: "var(--text-primary)",
            marginBottom: "4px",
            fontFamily: "var(--font-display)",
          }}>
            {getGreeting()}, {profile?.full_name?.split(" ")[0] || profile?.username || "Student"}!
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>
            {DAYS[currentTime.getDay()]}, {currentTime.toLocaleDateString("en-US", { 
              month: "long", 
              day: "numeric",
              year: "numeric"
            })}
          </p>
        </div>

        {/* Daily Quote Card */}
        <div style={{
          background: "linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)",
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Star size={18} fill="white" />
              <span style={{ fontSize: "12px", fontWeight: 600, opacity: 0.9, textTransform: "uppercase", letterSpacing: "1px" }}>
                Daily Inspiration
              </span>
            </div>
            <p style={{ fontSize: "15px", lineHeight: 1.6, fontStyle: "italic", marginBottom: "12px" }}>
              "{todayQuote.text}"
            </p>
            <p style={{ fontSize: "13px", opacity: 0.8, fontWeight: 500 }}>
              — {todayQuote.author}
            </p>
          </div>
        </div>

        {/* Week Calendar Strip */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--surface)",
          borderRadius: "16px",
          padding: "16px",
          marginBottom: "20px",
          border: "1px solid var(--border)",
        }}>
          {weekDays.map((day, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                padding: "8px 12px",
                borderRadius: "12px",
                background: day.isToday ? "#0D9488" : "transparent",
                color: day.isToday ? "white" : day.isPast ? "var(--text-muted)" : "var(--text-primary)",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 500 }}>{day.name}</span>
              <span style={{ 
                fontSize: "16px", 
                fontWeight: day.isToday ? 700 : 600,
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                background: day.isToday ? "rgba(255,255,255,0.2)" : "transparent",
              }}>
                {day.date}
              </span>
            </div>
          ))}
        </div>

        {/* Stats Grid */}
        <StaggerChildren>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
            marginBottom: "20px",
          }}>
            {/* Streak */}
            <div
              onClick={() => navigate("/flashcards")}
              style={{
                background: "var(--surface)",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid var(--border)",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(239, 68, 68, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#EF4444",
                }}>
                  <Flame size={20} />
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>Streak</span>
              </div>
              <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>
                {stats.streak_days}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>days active</p>
            </div>

            {/* Study Time */}
            <div
              onClick={() => navigate("/notes")}
              style={{
                background: "var(--surface)",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid var(--border)",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(59, 130, 246, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#3B82F6",
                }}>
                  <Clock size={20} />
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>Today</span>
              </div>
              <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>
                {Math.floor(stats.study_minutes_today / 60)}h {stats.study_minutes_today % 60}m
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>study time</p>
            </div>

            {/* Quiz Score */}
            <div
              onClick={() => navigate("/quiz")}
              style={{
                background: "var(--surface)",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid var(--border)",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(139, 92, 246, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#8B5CF6",
                }}>
                  <Trophy size={20} />
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>Avg Score</span>
              </div>
              <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>
                {stats.average_score}%
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{stats.total_quizzes_taken} quizzes</p>
            </div>

            {/* Flashcards */}
            <div
              onClick={() => navigate("/flashcards")}
              style={{
                background: "var(--surface)",
                borderRadius: "16px",
                padding: "16px",
                border: "1px solid var(--border)",
                cursor: "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(16, 185, 129, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#10B981",
                }}>
                  <Zap size={20} />
                </div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>Reviews</span>
              </div>
              <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>
                {stats.flashcards_reviewed}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>this week</p>
            </div>
          </div>
        </StaggerChildren>

        {/* Progress Bar — Weekly Goal */}
        <div style={{
          background: "var(--surface)",
          borderRadius: "16px",
          padding: "16px",
          border: "1px solid var(--border)",
          marginBottom: "20px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Target size={18} color="#0D9488" />
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>Weekly Study Goal</span>
            </div>
            <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 500 }}>
              {Math.min(Math.round((stats.total_study_minutes / 300) * 100), 100)}% of 5h goal
            </span>
          </div>
          <div style={{
            height: "8px",
            background: "var(--border)",
            borderRadius: "4px",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${Math.min((stats.total_study_minutes / 300) * 100, 100)}%`,
              background: "linear-gradient(90deg, #0D9488, #14B8A6)",
              borderRadius: "4px",
              transition: "width 1s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {Math.floor(stats.total_study_minutes / 60)}h {stats.total_study_minutes % 60}m studied
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {stats.communities_joined} communities
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
            Quick Actions
          </h2>
          <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "4px" }}>
            {[
              { label: "Study", icon: BookOpen, path: "/flashcards", color: "#10B981" },
              { label: "Quiz", icon: Brain, path: "/quiz", color: "#8B5CF6" },
              { label: "Notes", icon: BookOpen, path: "/notes", color: "#F59E0B" },
              { label: "Create", icon: Pencil, path: "/create", color: "#3B82F6" },
              { label: "News", icon: Newspaper, path: "/news", color: "#EC4899" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  padding: "12px 16px",
                  borderRadius: "14px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  cursor: "pointer",
                  minWidth: "72px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = action.color;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: `${action.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: action.color,
                }}>
                  <action.icon size={20} />
                </div>
                <span style={{ fontSize: "12px", fontWeight: 500 }}>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={18} color="#0D9488" />
              Coming Up
            </h2>
            <button 
              onClick={() => navigate("/quiz")}
              style={{ 
                fontSize: "13px", 
                color: "#0D9488", 
                background: "none", 
                border: "none", 
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              View all <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {upcomingTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  background: "var(--surface)",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#0D9488";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                }}
              >
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: task.type === "quiz" ? "rgba(139, 92, 246, 0.1)" : 
                              task.type === "study" ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: task.type === "quiz" ? "#8B5CF6" : task.type === "study" ? "#10B981" : "#F59E0B",
                }}>
                  {task.type === "quiz" ? <Brain size={20} /> : 
                   task.type === "study" ? <BookOpen size={20} /> : <Calendar size={20} />}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px", marginBottom: "2px" }}>
                    {task.title}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Due {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <ArrowUpRight size={18} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp size={18} color="#0D9488" />
              Recent Activity
            </h2>
          </div>
          {recentActivity.length === 0 ? (
            <div style={{
              background: "var(--surface)",
              borderRadius: "16px",
              padding: "32px 16px",
              textAlign: "center",
              border: "1px dashed var(--border)",
            }}>
              <Activity size={40} color="var(--text-muted)" style={{ marginBottom: "12px", opacity: 0.5 }} />
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                No recent activity. Start studying to see your progress!
              </p>
              <button
                onClick={() => navigate("/quiz")}
                style={{
                  marginTop: "12px",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  background: "#0D9488",
                  color: "white",
                  border: "none",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Take a Quiz
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    background: "var(--surface)",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    border: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: `${getActivityColor(activity.type)}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: getActivityColor(activity.type),
                  }}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: "14px" }}>
                      {activity.title}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {formatTimeAgo(activity.timestamp)}
                      {activity.score !== undefined && (
                        <span style={{ color: activity.score >= 70 ? "#10B981" : "#F59E0B", marginLeft: "8px", fontWeight: 600 }}>
                          {activity.score}%
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Community Stats */}
        <div style={{
          background: "var(--surface)",
          borderRadius: "16px",
          padding: "16px",
          border: "1px solid var(--border)",
          marginBottom: "20px",
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <GraduationCap size={18} color="#0D9488" />
            Community
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
            <div style={{ textAlign: "center", padding: "12px", borderRadius: "10px", background: "var(--background)" }}>
              <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>{stats.posts_created}</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Posts</p>
            </div>
            <div style={{ textAlign: "center", padding: "12px", borderRadius: "10px", background: "var(--background)" }}>
              <p style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>{stats.communities_joined}</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Communities</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/discover-communities")}
            style={{
              width: "100%",
              marginTop: "12px",
              padding: "10px",
              borderRadius: "10px",
              background: "transparent",
              border: "1px dashed var(--border)",
              color: "#0D9488",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <TrendingUp size={16} />
            Discover More Communities
          </button>
        </div>

        {/* Subscription Teaser */}
        <div style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          borderRadius: "16px",
          padding: "20px",
          color: "white",
          position: "relative",
          overflow: "hidden",
          marginBottom: "20px",
        }}>
          <div style={{
            position: "absolute",
            top: "-30px",
            right: "-30px",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Star size={18} fill="#FBBF24" color="#FBBF24" />
              <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#FBBF24" }}>
                Coming Soon
              </span>
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
              Unlock Premium Features
            </h3>
            <p style={{ fontSize: "14px", opacity: 0.8, marginBottom: "16px", lineHeight: 1.5 }}>
              Get unlimited AI chat, RAG knowledge base for your notes, advanced study tools, and priority support.
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {["Unlimited AI", "RAG Knowledge Base", "File Storage", "No Ads"].map((feature) => (
                <span
                  key={feature}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "20px",
                    background: "rgba(255,255,255,0.1)",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </AnimatedPage>
  );
}
