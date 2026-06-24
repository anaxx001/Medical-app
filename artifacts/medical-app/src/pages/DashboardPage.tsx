import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LineChart, Sparkles, AlertCircle, Play, Pause, Bookmark, Star, Calendar, 
  HelpCircle, UserCheck, Timer, BookOpen, Clock, Users, ArrowUpRight, GraduationCap, X, RotateCcw
} from "lucide-react";

export default function DashboardPage() {
  const supabase = createClient();
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Focus sprint block state
  const [sprintTimeLeft, setSprintTimeLeft] = useState(1500); // 25 mins
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerTag, setTimerTag] = useState("Pharmacology");
  const [learningPrompt, setLearningPrompt] = useState(false);
  const [learnedNote, setLearnedNote] = useState("");

  // Dismissible emergency wellness banner
  const [showWellnessBanner, setShowWellnessBanner] = useState(true);

  // Fetch student parameters and news
  const [latestNews, setLatestNews] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (userProfile) setProfile(userProfile);
      }

      const { data: news } = await supabase
        .from("news_posts")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(2);
      if (news) setLatestNews(news);

      setLoading(false);
    }
    loadData();
  }, []);

  // Countdown timer logic
  useEffect(() => {
    let interval: any = null;
    if (timerRunning && sprintTimeLeft > 0) {
      interval = setInterval(() => {
        setSprintTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (sprintTimeLeft === 0 && timerRunning) {
      setTimerRunning(false);
      setLearningPrompt(true);
    }
    return () => clearInterval(interval);
  }, [timerRunning, sprintTimeLeft]);

  const toggleTimer = () => setTimerRunning(!timerRunning);
  const resetTimer = () => {
    setTimerRunning(false);
    setSprintTimeLeft(1500);
  };

  const saveLearnedProgress = async () => {
    if (learnedNote.trim()) {
      // Record focus session to database
      await supabase.from("focus_sessions").insert({
        subject: timerTag,
        learned_summary: learnedNote,
        duration_minutes: 25,
        created_at: new Date().toISOString()
      });
      setLearnedNote("");
      setLearningPrompt(false);
      resetTimer();
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", fontWeight: 500 }}>Loading academic workspace...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 16px 80px", fontFamily: "var(--font-body)", color: "var(--text)" }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, color: "#0D9488" }}>STUDENT CORE CONSOLE</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: 800, margin: "4px 0 0", letterSpacing: "-1px" }}>
            Hi, {profile?.full_name || "Doctor"} 👋
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "4px 0 0" }}>
            {profile?.university || "Nigerian Medical College"} • {profile?.study_year || "Pre-Clinical Student"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/chatbot" style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(13,148,136,0.1)", color: "#0D9488", padding: "10px 16px", borderRadius: "12px", fontWeight: 600, fontSize: "13.5px", textDecoration: "none", border: "1px solid rgba(13,148,136,0.15)" }}>
            <Sparkles size={16} />
            Research Co-pilot
          </Link>
          <Link href="/profile-settings" style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", padding: "10px 16px", borderRadius: "12px", fontWeight: 600, fontSize: "13.5px", textDecoration: "none" }}>
            Manage Track
          </Link>
        </div>
      </div>

      {/* DISMISSIBLE EMERGENCY WELLNESS BANNER */}
      <AnimatePresence>
        {showWellnessBanner && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            style={{ 
              background: "linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)", 
              border: "1px solid #FDA4AF", 
              borderRadius: "16px", 
              padding: "16px 20px", 
              marginBottom: "28px", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "flex-start", 
              gap: "16px" 
            }}
          >
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
              <div style={{ background: "#F43F5E", color: "white", padding: "8px", borderRadius: "10px", display: "flex" }}>
                <AlertCircle size={18} />
              </div>
              <div>
                <strong style={{ fontSize: "15px", color: "#9F1239", display: "block", marginBottom: "2px" }}>Feeling High-Pressure or Overwhelmed?</strong>
                <p style={{ margin: 0, fontSize: "13px", color: "#BE123C", lineHeight: 1.4 }}>
                  Medical school is isolating. Call the free Nigerian Student Crisis line immediately at <strong style={{ textDecoration: "underline" }}>+234 (0) 800-MENTAL-HELP</strong> or talk anonymously in our safe support forum.
                </p>
                <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                  <Link href="/messages" style={{ fontSize: "12px", fontWeight: 700, color: "#9F1239", textDecoration: "underline" }}>Find Peer Support</Link>
                  <a href="tel:+234800636825" style={{ fontSize: "12px", fontWeight: 700, color: "#9F1239", textDecoration: "underline" }}>Call Support Hub</a>
                </div>
              </div>
            </div>
            <button onClick={() => setShowWellnessBanner(false)} style={{ background: "none", border: "none", color: "#F43F5E", cursor: "pointer", padding: "4px" }}>
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", lg: "1fr 340px", gap: "28px" }} className="lg:grid-cols-[1fr_340px]">
        
        {/* LEFT COLUMN: MAIN WORKSPACE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          {/* QUICK STATS BLOCK */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", p: "20px", padding: "20px", borderRadius: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <Clock size={20} color="#0D9488" />
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>This Week</span>
              </div>
              <span style={{ fontSize: "28px", fontWeight: 800 }}>14.2 hrs</span>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>Aesthetic Study sprints</p>
            </div>
            
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", p: "20px", padding: "20px", borderRadius: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <BookOpen size={20} color="#0369A1" />
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Total Decks</span>
              </div>
              <span style={{ fontSize: "28px", fontWeight: 800 }}>8 Decks</span>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>421 Flashcards mastered</p>
            </div>

            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", p: "20px", padding: "20px", borderRadius: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <Users size={20} color="#6B21A8" />
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Verified</span>
              </div>
              <span style={{ fontSize: "28px", fontWeight: 800 }}>12 Peers</span>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>Helped in clinical forum</p>
            </div>
          </div>

          {/* POMODORO WORKSPACE */}
          <div style={{ background: "var(--surface)", border: "1px solid #E2E8F0", borderRadius: "20px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Timer size={22} color="#0D9488" />
                <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "18px" }}>Study Sprint (Focus Timer)</h3>
              </div>
              <select 
                value={timerTag} 
                onChange={(e) => setTimerTag(e.target.value)}
                style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", borderRadius: "8px", padding: "6px 12px", fontSize: "13px", fontWeight: 600, color: "var(--text)", outline: "none" }}
              >
                <option value="Pharmacology">Pharmacology</option>
                <option value="Gross Anatomy">Gross Anatomy</option>
                <option value="Physiology">Physiology</option>
                <option value="Clinical Pathology">Clinical Pathology</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "32px", padding: "20px 0", flexWrap: "wrap" }}>
              <div style={{ fontSize: "52px", fontWeight: 900, fontFamily: "monospace", letterSpacing: "2px", color: "var(--text)" }}>
                {formatTime(sprintTimeLeft)}
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button 
                  onClick={toggleTimer}
                  style={{ background: "#0D9488", color: "white", width: "48px", height: "48px", borderRadius: "50%", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  {timerRunning ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: "4px" }} />}
                </button>
                <button 
                  onClick={resetTimer}
                  style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", width: "48px", height: "48px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text)" }}
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            </div>

            {/* Prompt modal inside Pomodoro if session finishes */}
            {learningPrompt && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ background: "var(--surface-muted)", border: "1px solid rgba(13,148,136,0.2)", borderRadius: "12px", padding: "16px", marginTop: "16px" }}
              >
                <strong style={{ display: "block", fontSize: "14px", color: "#0D9488", marginBottom: "6px" }}>🎓 Sprint Complete! What did you master?</strong>
                <textarea 
                  rows={2}
                  placeholder="Record what you learned to sync with study circles."
                  value={learnedNote}
                  onChange={(e) => setLearnedNote(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "13.5px", outline: "none", resize: "none" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
                  <button onClick={() => setLearningPrompt(false)} style={{ background: "none", border: "none", fontSize: "12px", color: "var(--text-muted)", cursor: "pointer" }}>Skip Sync</button>
                  <button onClick={saveLearnedProgress} style={{ background: "#0D9488", color: "white", padding: "6px 14px", borderRadius: "8px", border: "none", fontWeight: 600, fontSize: "12.5px", cursor: "pointer" }}>Save & Sync</button>
                </div>
              </motion.div>
            )}
          </div>

          {/* LATEST CAMPUS NEWS SECTION */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "18px" }}>Latest Campus News</h3>
              <Link href="/news" style={{ fontSize: "12px", color: "#0D9488", fontWeight: 700, textDecoration: "none" }}>View All News</Link>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {latestNews.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>No news published recently.</p>
              ) : latestNews.map(news => (
                <Link key={news.id} href={`/news/${news.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ padding: "14px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface-muted)", transition: "border-color 0.2s" }} className="hover:border-[#0D9488]">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "#0D9488", textTransform: "uppercase" }}>{news.category}</span>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{new Date(news.created_at).toLocaleDateString()}</span>
                    </div>
                    <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>{news.title}</h4>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {news.excerpt || news.body}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* AI CO-PILOT SHORTCUTS */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px" }}>
            <h3 style={{ margin: "0 0 16px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "18px" }}>AI Research Co-pilot Shortcuts</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr md:1fr 1fr", gap: "16px" }} className="grid-cols-1 md:grid-cols-3">
              <Link href="/chatbot?prompt=Summarize this complex medical paper:" style={{ textDecoration: "none" }}>
                <div style={{ border: "1px solid var(--border)", padding: "16px", borderRadius: "12px", background: "rgba(13,148,136,0.03)", cursor: "pointer", transition: "transform 0.2s" }} className="hover:scale-105">
                  <span style={{ fontSize: "20px" }}>📄</span>
                  <h4 style={{ margin: "8px 0 4px", fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Paper Explainer</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.3 }}>Drop dense health papers & get 2nd-year level explanations.</p>
                </div>
              </Link>

              <Link href="/chatbot?prompt=Quiz me on:" style={{ textDecoration: "none" }}>
                <div style={{ border: "1px solid var(--border)", padding: "16px", borderRadius: "12px", background: "rgba(3,105,161,0.03)", cursor: "pointer", transition: "transform 0.2s" }} className="hover:scale-105">
                  <span style={{ fontSize: "20px" }}>🧠</span>
                  <h4 style={{ margin: "8px 0 4px", fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Exam Drills</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.3 }}>Auto-generate custom study questions & flashcards.</p>
                </div>
              </Link>

              <Link href="/chatbot?prompt=Provide real-time clinical context for:" style={{ textDecoration: "none" }}>
                <div style={{ border: "1px solid var(--border)", padding: "16px", borderRadius: "12px", background: "rgba(107,33,168,0.03)", cursor: "pointer", transition: "transform 0.2s" }} className="hover:scale-105">
                  <span style={{ fontSize: "20px" }}>❤️</span>
                  <h4 style={{ margin: "8px 0 4px", fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>Pulse Diagnosis</h4>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.3 }}>Ask complex clinical symptom questions & case breakdown.</p>
                </div>
              </Link>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: PENDING REQUESTS & UPCOMING EXAMS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          {/* PENDING ACADEMIC REQUESTS */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px" }}>
            <h4 style={{ margin: "0 0 16px", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)" }}>Pending Invitations</h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontSize: "20px" }}>👥</span>
                  <div>
                    <h5 style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>Ada's Cardio Cram Circle</h5>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-muted)" }}>Exam in 4 days • Max 8 members • Active now</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button style={{ background: "#F1F5F9", border: "none", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "6px", cursor: "pointer" }}>Dismiss</button>
                  <button onClick={() => setLocation("/messages")} style={{ background: "#0D9488", border: "none", color: "white", fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "6px", cursor: "pointer" }}>Join Study</button>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontSize: "20px" }}>🩺</span>
                  <div>
                    <h5 style={{ margin: 0, fontSize: "13px", fontWeight: 700 }}>Mentorship Request Accepted</h5>
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-muted)" }}>Dr. Chioma liked your clinical pathology query</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button onClick={() => setLocation("/messages")} style={{ background: "#0D9488", border: "none", color: "white", fontSize: "12px", fontWeight: 600, padding: "5px 10px", borderRadius: "6px", cursor: "pointer" }}>View chat thread</button>
                </div>
              </div>
            </div>
          </div>

          {/* EXAM COUNTDOWN */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h4 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px" }}>Upcoming School Exams</h4>
              <span style={{ fontSize: "11px", color: "#0D9488", fontWeight: 700 }}>MDCN Standard</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-muted)", padding: "12px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <div>
                  <strong style={{ fontSize: "13px", display: "block" }}>MBBS Part 1 (Pharmacology)</strong>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>July 28, 2026</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#F43F5E" }}>36 Days</span>
                  <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>remaining</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-muted)", padding: "12px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                <div>
                  <strong style={{ fontSize: "13px", display: "block" }}>Gross Anatomy Viva</strong>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>August 12, 2026</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "14px", fontWeight: 800, color: "#D97706" }}>51 Days</span>
                  <span style={{ display: "block", fontSize: "10px", color: "var(--text-muted)" }}>remaining</span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
