import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// The app will prioritize the real Supabase connection if URL and Key are provided.
const isConfigured = 
  supabaseUrl && 
  supabaseUrl.trim() !== "" && 
  supabaseAnonKey && 
  supabaseAnonKey.trim() !== "" &&
  !supabaseUrl.includes("your-project");

// ==========================================
// SEED DATA FOR SANDBOX MODE
// ==========================================
const DEFAULT_USERS = [
  {
    id: "dr-emeka-id",
    email: "admin@medstudent.com",
    password: "adminpassword",
    full_name: "Dr. Chukwuemeka Obi",
    username: "dr_emeka",
    profession: "Medical Doctor",
    study_year: "Consultant",
    role: "super_admin",
  },
  {
    id: "student-obi-id",
    email: "ifuksam@gmail.com",
    password: "password",
    full_name: "Obi Nwosu",
    username: "obi_nwosu",
    profession: "Medical Doctor",
    study_year: "Year 3",
    role: "super_admin",
  }
];

const DEFAULT_PROFILES = [
  {
    id: "dr-emeka-id",
    username: "dr_emeka",
    full_name: "Dr. Chukwuemeka Obi",
    profession: "Medical Doctor",
    study_year: "Consultant",
    university: "University of Lagos",
    institution: "University of Lagos",
    role: "super_admin",
    avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=dr_emeka",
    email: "admin@medstudent.com",
    bio: "Cardiologist & Consultant. Passionate about medical education and mentorship in Nigeria.",
  },
  {
    id: "student-obi-id",
    username: "obi_nwosu",
    full_name: "Obi Nwosu",
    email: "ifuksam@gmail.com",
    profession: "Medical Doctor",
    study_year: "Year 3",
    university: "University of Benin",
    institution: "University of Benin",
    role: "super_admin",
    avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=obi_nwosu",
    bio: "Preclinical representative. Love internal medicine and study groups.",
  },
  {
    id: "student-2-id",
    username: "tunde_bakare",
    full_name: "Tunde Bakare",
    email: "tunde@example.com",
    profession: "Medical Student",
    study_year: "Year 4",
    university: "University of Ibadan",
    institution: "University of Ibadan",
    role: "student",
    avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=tunde",
    bio: "Aspiring surgeon. Focused on surgical techniques and clinical rotations.",
  },
  {
    id: "student-3-id",
    username: "chioma_eze",
    full_name: "Chioma Eze",
    email: "chioma@example.com",
    profession: "Medical Student",
    study_year: "Year 2",
    university: "Obafemi Awolowo University",
    institution: "Obafemi Awolowo University",
    role: "student",
    avatar_url: "https://api.dicebear.com/7.x/adventurer/svg?seed=chioma",
    bio: "Enthusiastic about pediatrics and public health in Nigeria.",
  }
];

const DEFAULT_POSTS = [
  {
    id: "post-1",
    title: "Essential high-yield Cardiology mnemonics for pro exams",
    content: "My fellow Nigerian students, here is a simple pneumonic to remember Heart Failure precipitating causes: FAILURE (Forgot medication, Arrhythmia, Ischemia, Lifestyle, Up-regulation, Renal failure, Embolism). Share yours below!",
    author_id: "dr-emeka-id",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    votes: 24,
    category: "Study Aids",
  },
  {
    id: "post-2",
    title: "Tips for Pathology - Metaplasia & Dysplasia",
    content: "Focus heavily on cell adaptation. Remember that Metaplasia is a reversible change of cell types, while Dysplasia is disordered growth. Keep this clear for MCQ!",
    author_id: "dr-emeka-id",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    votes: 15,
    category: "General",
  }
];

const DEFAULT_COMMUNITIES = [
  { id: "comm-1", name: "Cardiology Hub", slug: "cardiology", description: "Discussions on heart diseases, ECG interpretation, and cardiovascular care.", creator_id: "student-obi-id", avatar_url: "https://images.unsplash.com/photo-1505751172107-16dcd4266395?w=400&h=400&fit=cover", banner_url: "https://images.unsplash.com/photo-1505751172107-16dcd4266395?w=1200&h=400&fit=cover" },
  { id: "comm-2", name: "Pharmacology & Prep", slug: "pharmacology", description: "Mnemonics and active recall on drug mechanisms and therapeutics.", creator_id: "student-obi-id", avatar_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=cover", banner_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200&h=400&fit=cover"  },
  { id: "comm-3", name: "Anatomy Legends", slug: "anatomy", description: "Discussions on gross anatomy, neuroanatomy, and embryology.", creator_id: "student-obi-id", avatar_url: "https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=400&h=400&fit=cover", banner_url: "https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=1200&h=400&fit=cover"  }
];

const DEFAULT_NEWS = [
  {
    id: "news-1",
    title: "NMA announces new medical student research grant for 2026",
    content: "The Nigerian Medical Association (NMA) has officially announced submissions are open for the national undergraduate research fellowship. Winning students receive up to NGN 500,000.",
    author_id: "dr-emeka-id",
    created_at: new Date().toISOString(),
    summary: "NMA Undergraduate research grants of up to NGN 500,000 are now open for health science students.",
  }
];

const DEFAULT_COMMUNITY_MEMBERS = [
  ...DEFAULT_COMMUNITIES.map(c => ({
    id: `member-admin-${c.id}`,
    community_id: c.id,
    user_id: c.creator_id,
    role: "admin",
    created_at: new Date().toISOString()
  })),
  ...DEFAULT_COMMUNITIES.map(c => ({
    id: `member-student-2-${c.id}`,
    community_id: c.id,
    user_id: "student-2-id",
    role: "member",
    created_at: new Date().toISOString()
  })),
  ...DEFAULT_COMMUNITIES.map(c => ({
    id: `member-student-3-${c.id}`,
    community_id: c.id,
    user_id: "student-3-id",
    role: "moderator",
    created_at: new Date().toISOString()
  }))
];

const DEFAULT_DATA: Record<string, any[]> = {
  profiles: DEFAULT_PROFILES,
  posts: DEFAULT_POSTS,
  communities: DEFAULT_COMMUNITIES,
  news_posts: DEFAULT_NEWS,
  comments: [],
  support_tickets: [],
  notifications: [],
  direct_messages: [],
  messages: [],
  post_votes: [
    { id: "vote-1", post_id: "post-1", user_id: "student-obi-id", vote_type: "up", created_at: new Date().toISOString() },
    { id: "vote-2", post_id: "post-2", user_id: "student-obi-id", vote_type: "up", created_at: new Date().toISOString() },
    { id: "vote-3", post_id: "post-1", user_id: "dr-emeka-id", vote_type: "up", created_at: new Date().toISOString() },
  ],
  community_requests: [],
  quiz_attempts: [],
  saved_posts: [],
  mentorships: [],
  study_circle_invites: [],
  threads: [],
  thread_participants: [],
  requests: [],
  community_members: DEFAULT_COMMUNITY_MEMBERS,
  community_posts: [],
  study_circles: [],
  study_circle_members: [],
  focus_sessions: [],
  exam_calendar: [],
  offline_queue: [],
  post_anonymous_map: [],
  report_posts: [],
  report_comments: [],
};

// ==========================================
// MOCK CLIENT IMPLEMENTATION
// ==========================================
class MockChannel {
  private name: string;
  private listeners: { event: string; callback: any }[] = [];

  constructor(name: string) {
    this.name = name;
  }

  on(event: string, filterOptions: any, callback: any) {
    this.listeners.push({ event, callback });
    return this;
  }

  subscribe(callback?: (status: any) => void) {
    if (callback) {
      callback("SUBSCRIBED");
    }
    return this;
  }

  unsubscribe() {
    return this;
  }
}

function getTableData(table: string): any[] {
  const key = `medstudent_mock_${table}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    try { 
        const parsed = JSON.parse(stored);
        if (parsed.length === 0 && DEFAULT_DATA[table] && DEFAULT_DATA[table].length > 0) {
             localStorage.setItem(key, JSON.stringify(DEFAULT_DATA[table]));
             return DEFAULT_DATA[table];
        }
        return parsed; 
    } catch { return DEFAULT_DATA[table] || []; }
  }
  return DEFAULT_DATA[table] || [];
}

export function hydrateMockItem(table: string, item: any): any {
  if (!item) return item;
  const copy = { ...item };

  if (table === "posts") {
    const profiles = getTableData("profiles");
    const author = profiles.find(p => p.id === copy.author_id);
    if (author) {
      copy.profiles = {
        id: author.id,
        username: author.username,
        full_name: author.full_name,
        avatar_url: author.avatar_url,
        profession: author.profession,
        role: author.role,
      };
      copy.author = copy.profiles;
    } else {
      copy.profiles = { id: copy.author_id, username: "unknown", full_name: "Unknown User", avatar_url: null, profession: "Student" };
      copy.author = copy.profiles;
    }

    const communities = getTableData("communities");
    const community = communities.find(c => c.id === copy.community_id);
    if (community) {
      const allMembersData = getTableData("community_members");
      const cMembersCount = allMembersData.filter(m => m.community_id === community.id).length;
      copy.community = {
        id: community.id,
        name: community.name,
        slug: community.slug,
        icon: community.icon || "🏥",
        icon_url: community.avatar_url || community.icon_url || null,
        avatar_url: community.avatar_url || community.icon_url || null,
        banner_url: community.banner_url || null,
        member_count: cMembersCount || community.member_count || 0,
      };
    } else {
      copy.community = null;
    }

    const comments = getTableData("comments");
    const commentsList = comments.filter(c => c.post_id === copy.id);
    copy.comment_count = [{ count: commentsList.length }];
    copy.comments_count = commentsList.length;

    // Hydrate votes
    const votes = getTableData("post_votes");
    const postVotes = votes.filter(v => v.post_id === copy.id);
    copy.vote_count = postVotes.reduce((acc, v) => acc + (v.vote_type === "up" ? 1 : -1), 0);
    
    // Check if current user has voted
    const sessionStr = localStorage.getItem("medstudent_mock_session");
    if (sessionStr) {
      try {
        const user = JSON.parse(sessionStr);
        const myVote = postVotes.find(v => v.user_id === user.id);
        copy.user_vote = myVote ? myVote.vote_type : null;
      } catch (e) {}
    }
  }

  else if (table === "comments") {
    const profiles = getTableData("profiles");
    const author = profiles.find(p => p.id === copy.author_id || p.id === copy.user_id);
    if (author) {
      copy.profiles = {
        id: author.id,
        username: author.username,
        full_name: author.full_name,
        avatar_url: author.avatar_url,
        profession: author.profession,
        study_year: author.study_year,
      };
      copy.author = copy.profiles;
      copy.author_track = author.study_year;
    } else {
      copy.author = { id: copy.author_id, username: "unknown", full_name: "Unknown User", avatar_url: null, profession: "Student" };
    }
  }

  else if (table === "saved_posts" || table === "bookmarks" || table === "reposts") {
    const posts = getTableData("posts");
    const rawPost = posts.find(p => p.id === copy.post_id);
    if (rawPost) {
      copy.post = hydrateMockItem("posts", rawPost);
    } else {
      copy.post = null;
    }
  }

  else if (table === "report_posts") {
    const posts = getTableData("posts");
    const rawPost = posts.find(p => p.id === copy.post_id);
    if (rawPost) {
      copy.post = hydrateMockItem("posts", rawPost);
    } else {
      copy.post = null;
    }
  }

  else if (table === "report_comments") {
    const comments = getTableData("comments");
    const rawComment = comments.find(c => c.id === copy.comment_id);
    if (rawComment) {
      copy.comment = hydrateMockItem("comments", rawComment);
    } else {
      copy.comment = null;
    }
  }

  else if (table === "news_posts") {
    const profiles = getTableData("profiles");
    const author = profiles.find(p => p.id === copy.author_id || p.id === copy.created_by);
    if (author) {
      copy.author = {
        id: author.id,
        username: author.username,
        full_name: author.full_name,
        role: author.role,
      };
    } else {
      copy.author = { id: copy.author_id, username: "unknown", full_name: "Unknown User", role: "moderator" };
    }
  }

  else if (table === "community_members") {
    const profiles = getTableData("profiles");
    const userProfile = profiles.find(p => p.id === copy.user_id);
    if (userProfile) {
      copy.profiles = {
        id: userProfile.id,
        username: userProfile.username,
        full_name: userProfile.full_name,
        avatar_url: userProfile.avatar_url,
        email: userProfile.email || "",
        role: userProfile.role || "user",
      };
      copy.user = copy.profiles;
    }
    const communities = getTableData("communities");
    const community = communities.find(c => c.id === copy.community_id);
    if (community) {
      copy.community = {
        id: community.id,
        name: community.name,
        slug: community.slug,
        icon_url: community.icon_url || null,
        member_count: community.member_count || 0,
      };
    }
  }

  else if (table === "community_officials") {
    const profiles = getTableData("profiles");
    const user = profiles.find(p => p.id === copy.user_id);
    if (user) {
      copy.user = {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      };
    }
  }

  else if (table === "community_invites") {
    const profiles = getTableData("profiles");
    const invitee = profiles.find(p => p.id === copy.invitee_id || p.id === copy.user_id);
    if (invitee) {
      copy.invitee = {
        id: invitee.id,
        username: invitee.username,
        full_name: invitee.full_name,
        avatar_url: invitee.avatar_url,
      };
    }
  }

  else if (table === "followers") {
    const profiles = getTableData("profiles");
    const follower = profiles.find(p => p.id === copy.follower_id);
    if (follower) {
      copy.follower = {
        id: follower.id,
        username: follower.username,
        full_name: follower.full_name,
        avatar_url: follower.avatar_url,
      };
    }
  }

  // Add counts for communities
  if (table === "communities") {
    const members = getTableData("community_members");
    const posts = getTableData("posts");
    copy.member_count = members.filter(m => m.community_id === copy.id).length;
    copy.post_count = posts.filter(p => p.community_id === copy.id).length;
  }

  return copy;
}

class MockQueryBuilder {
  private table: string;
  private filters: ((item: any) => boolean)[] = [];
  private sorter: ((a: any, b: any) => number) | null = null;
  private limitVal: number | null = null;
  private countVal: boolean = false;
  private headVal: boolean = false;
  private rangeVal: { from: number; to: number } | null = null;

  private isUpdate: boolean = false;
  private updateData: any = null;
  private isDelete: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  private getData(): any[] {
    const key = `medstudent_mock_${this.table}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try { 
          const parsed = JSON.parse(stored);
          if (parsed.length === 0 && DEFAULT_DATA[this.table] && DEFAULT_DATA[this.table].length > 0) {
              localStorage.setItem(key, JSON.stringify(DEFAULT_DATA[this.table]));
              return DEFAULT_DATA[this.table];
          }
          return parsed; 
      } catch { return DEFAULT_DATA[this.table] || []; }
    }
    const defaults = DEFAULT_DATA[this.table] || [];
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }

  private saveData(data: any[]) {
    const key = `medstudent_mock_${this.table}`;
    localStorage.setItem(key, JSON.stringify(data));
  }

  select(columns?: string, options?: any) {
    if (options) {
      if (options.count === "exact") {
        this.countVal = true;
      }
      if (options.head === true) {
        this.headVal = true;
      }
    }
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.sorter = (a, b) => {
      const valA = a[column];
      const valB = b[column];
      if (valA === undefined || valA === null) return ascending ? 1 : -1;
      if (valB === undefined || valB === null) return ascending ? -1 : 1;
      if (valA < valB) return ascending ? -1 : 1;
      if (valA > valB) return ascending ? 1 : -1;
      return 0;
    };
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push(item => {
      if (item[column] === value) return true;
      if (value === true && (item[column] === true || item[column] === "true")) return true;
      if (value === false && (item[column] === false || item[column] === "false")) return true;
      if (typeof value === "string" && String(item[column]) === value) return true;
      return false;
    });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push(item => {
      if (item[column] === value) return false;
      if (value === true && (item[column] === true || item[column] === "true")) return false;
      if (value === false && (item[column] === false || item[column] === "false")) return false;
      if (typeof value === "string" && String(item[column]) === value) return false;
      return true;
    });
    return this;
  }

  gt(column: string, value: any) {
    this.filters.push(item => {
      const itemVal = item[column];
      if (itemVal === undefined || itemVal === null) return false;
      return itemVal > value;
    });
    return this;
  }

  lt(column: string, value: any) {
    this.filters.push(item => {
      const itemVal = item[column];
      if (itemVal === undefined || itemVal === null) return false;
      return itemVal < value;
    });
    return this;
  }

  gte(column: string, value: any) {
    this.filters.push(item => {
      const itemVal = item[column];
      if (itemVal === undefined || itemVal === null) return false;
      return itemVal >= value;
    });
    return this;
  }

  lte(column: string, value: any) {
    this.filters.push(item => {
      const itemVal = item[column];
      if (itemVal === undefined || itemVal === null) return false;
      return itemVal <= value;
    });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push(item => values.includes(item[column]) || values.map(String).includes(String(item[column])));
    return this;
  }

  is(column: string, value: any) {
    this.filters.push(item => item[column] === value);
    return this;
  }

  limit(limitNum: number) {
    this.limitVal = limitNum;
    return this;
  }

  range(from: number, to: number) {
    this.rangeVal = { from, to };
    return this;
  }

  or(exprString: string) {
    this.filters.push(item => {
      // 1. Check for and(...) pattern, eg:
      // and(sender_id.eq.user-1,receiver_id.eq.user-2),and(sender_id.eq.user-2,receiver_id.eq.user-1)
      if (exprString.includes("and(")) {
        const parts = exprString.split("),");
        return parts.some(part => {
          const cleaned = part.replace("and(", "").replace(")", "");
          const subConds = cleaned.split(",");
          return subConds.every(subCond => {
            const subPart = subCond.split(".eq.");
            if (subPart.length === 2) {
              const col = subPart[0].trim();
              const val = subPart[1].trim();
              return String(item[col]) === val;
            }
            return false;
          });
        });
      }

      // 2. Otherwise split by comma (implicit OR)
      const orParts = exprString.split(",");
      return orParts.some(part => {
        if (part.includes(".eq.")) {
          const [col, val] = part.split(".eq.");
          return String(item[col.trim()]) === val.trim();
        }
        if (part.includes(".ilike.")) {
          const [col, val] = part.split(".ilike.");
          const cleanVal = val.trim().replace(/%/g, "").toLowerCase();
          return String(item[col.trim()] || "").toLowerCase().includes(cleanVal);
        }
        return false;
      });
    });
    return this;
  }

  private executeMutations() {
    if (!this.isUpdate && !this.isDelete) return;

    let items = this.getData();
    let beforeLen = items.length;

    if (this.isUpdate) {
      items = items.map(item => {
        let isMatch = true;
        for (const filter of this.filters) {
          if (!filter(item)) isMatch = false;
        }
        if (isMatch) {
          return { ...item, ...this.updateData, updated_at: new Date().toISOString() };
        }
        return item;
      });
      // specific logic for profiles login
      if (this.table === "profiles") {
        const sessionStr = localStorage.getItem("medstudent_mock_session");
        if (sessionStr) {
          try {
            const s = JSON.parse(sessionStr);
            let isMatch = true;
            for (const filter of this.filters) {
              if (!filter(s)) isMatch = false;
            }
            if (isMatch) {
              const updatedSession = { ...s, ...this.updateData };
              localStorage.setItem("medstudent_mock_session", JSON.stringify(updatedSession));
            }
          } catch (e) {
             // ignore
          }
        }
      }
    } else if (this.isDelete) {
      items = items.filter(item => {
        let isMatch = true;
        for (const filter of this.filters) {
          if (!filter(item)) isMatch = false;
        }
        return !isMatch;
      });
    }

    this.saveData(items);
  }

  then(resolve?: any, reject?: any) {
    this.executeMutations();

    let items = this.getData();
    for (const filter of this.filters) {
      items = items.filter(filter);
    }
    const totalCount = items.length;
    if (this.sorter) {
      items.sort(this.sorter);
    }
    if (this.rangeVal !== null) {
      items = items.slice(this.rangeVal.from, this.rangeVal.to + 1);
    } else if (this.limitVal !== null) {
      items = items.slice(0, this.limitVal);
    }

    const hydratedItems = items.map(item => hydrateMockItem(this.table, item));

    const res = {
      data: this.headVal ? null : hydratedItems,
      count: this.countVal ? totalCount : (this.headVal ? totalCount : undefined),
      error: null
    };

    if (resolve) {
      resolve(res);
    }
    return Promise.resolve(res);
  }

  async single() {
    this.executeMutations();

    let items = this.getData();
    for (const filter of this.filters) {
      items = items.filter(filter);
    }
    if (this.sorter) {
      items.sort(this.sorter);
    }
    const item = items[0] || null;
    const hydratedItem = hydrateMockItem(this.table, item);
    return { data: hydratedItem, error: hydratedItem ? null : { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" } };
  }

  async maybeSingle() {
    this.executeMutations();

    let items = this.getData();
    for (const filter of this.filters) {
      items = items.filter(filter);
    }
    if (this.sorter) {
      items.sort(this.sorter);
    }
    const item = items[0] || null;
    const hydratedItem = hydrateMockItem(this.table, item);
    return { data: hydratedItem, error: null };
  }

  async insert(newData: any | any[]) {
    let items = this.getData();
    const rows = Array.isArray(newData) ? newData : [newData];
    const createdRows: any[] = [];
    for (const row of rows) {
      const newRow = {
        id: row.id || "id-" + Math.random().toString(36).substring(2, 9),
        created_at: new Date().toISOString(),
        ...row,
      };
      items.push(newRow);
      createdRows.push(newRow);
    }
    this.saveData(items);

    const returning = Array.isArray(newData) ? createdRows : createdRows[0];
    const hydratedReturning = Array.isArray(returning)
      ? returning.map(r => hydrateMockItem(this.table, r))
      : hydrateMockItem(this.table, returning);

    const selectObj = {
      then: (resolve: any, reject: any) => Promise.resolve({ data: hydratedReturning, error: null }).then(resolve, reject),
      single: async () => ({ data: Array.isArray(hydratedReturning) ? hydratedReturning[0] : hydratedReturning, error: null })
    };

    const response = {
      data: hydratedReturning,
      error: null,
      select: () => selectObj,
      then: (resolve: any, reject: any) => Promise.resolve({ data: hydratedReturning, error: null }).then(resolve, reject),
      catch: (reject: any) => Promise.resolve({ data: hydratedReturning, error: null }).catch(reject)
    };
    return response as any;
  }

  update(updateData: any) {
    this.isUpdate = true;
    this.updateData = updateData;
    return this;
  }

  upsert(data: any | any[]) {
    let items = this.getData();
    const rows = Array.isArray(data) ? data : [data];
    for (const r of rows) {
      const idx = items.findIndex(item => item.id === r.id);
      if (idx > -1) {
        items[idx] = { ...items[idx], ...r, updated_at: new Date().toISOString() };
      } else {
        items.push({ id: r.id || "id-" + Math.random().toString(36).substring(2, 9), created_at: new Date().toISOString(), ...r });
      }
    }
    this.saveData(items);
    
    // upsert doesn't need to chain .eq generally in Supabase
    const selectObj = {
      then: (resolve: any, reject: any) => Promise.resolve({ data, error: null }).then(resolve, reject),
      single: async () => ({ data: data, error: null })
    };
    return { data, error: null, select: () => selectObj, then: (resolve: any, reject: any) => Promise.resolve({ data, error: null }).then(resolve, reject) } as any;
  }

  delete() {
    this.isDelete = true;
    return this;
  }
}

class MockSupabaseClient {
  auth = {
    getUser: async () => {
      const session = localStorage.getItem("medstudent_mock_session");
      if (session) {
        try {
          const user = JSON.parse(session);
          return { data: { user }, error: null };
        } catch {
          return { data: { user: null }, error: null };
        }
      }
      return { data: { user: null }, error: null };
    },
    getSession: async () => {
      const session = localStorage.getItem("medstudent_mock_session");
      if (session) {
        try {
          const user = JSON.parse(session);
          return { data: { session: { user, access_token: "mock-token" } }, error: null };
        } catch {
          return { data: { session: null }, error: null };
        }
      }
      return { data: { session: null }, error: null };
    },
    signInWithPassword: async ({ email, password }: any) => {
      const users = JSON.parse(localStorage.getItem("medstudent_mock_users") || JSON.stringify(DEFAULT_USERS));
      const found = users.find((u: any) => u.email === email && u.password === password);
      if (!found) {
        return { data: { user: null }, error: new Error("Invalid email or password.") };
      }
      localStorage.setItem("medstudent_mock_session", JSON.stringify(found));
      this.triggerAuthChange("SIGNED_IN", found);
      return { data: { user: found }, error: null };
    },
    signUp: async ({ email, password, options }: any) => {
      const users = JSON.parse(localStorage.getItem("medstudent_mock_users") || JSON.stringify(DEFAULT_USERS));
      if (users.some((u: any) => u.email === email)) {
        return { data: { user: null }, error: new Error("Account with this email already exists.") };
      }
      const newUser = {
        id: "mock-id-" + Math.random().toString(36).substring(2, 9),
        email,
        password,
        full_name: options?.data?.full_name || "Medical Student",
        username: options?.data?.username || "student_" + Math.random().toString(36).substring(2, 4),
        profession: options?.data?.profession || "Other",
        study_year: options?.data?.study_year || "Year 1",
        role: "student",
        created_at: new Date().toISOString(),
      };
      users.push(newUser);
      localStorage.setItem("medstudent_mock_users", JSON.stringify(users));

      // Build profile
      const profilesKey = "medstudent_mock_profiles";
      let profiles = JSON.parse(localStorage.getItem(profilesKey) || "[]");
      if (profiles.length === 0) {
        profiles = [...DEFAULT_PROFILES];
      }
      profiles.push({
        id: newUser.id,
        username: newUser.username,
        full_name: newUser.full_name,
        profession: newUser.profession,
        study_year: newUser.study_year,
        role: newUser.role,
        avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${newUser.username}`,
        bio: "Medical Student. Ready to study on MedStudent!",
      });
      localStorage.setItem(profilesKey, JSON.stringify(profiles));

      localStorage.setItem("medstudent_mock_session", JSON.stringify(newUser));
      this.triggerAuthChange("SIGNED_IN", newUser);
      return { data: { user: newUser }, error: null };
    },
    updateUser: async (attributes: any) => {
      const session = localStorage.getItem("medstudent_mock_session");
      if (session) {
        try {
          const user = JSON.parse(session);
          const updatedUser = {
            ...user,
            ...attributes,
            user_metadata: { ...(user.user_metadata || {}), ...(attributes.data || {}) },
            full_name: attributes.data?.full_name || user.full_name,
            username: attributes.data?.username || user.username,
          };
          localStorage.setItem("medstudent_mock_session", JSON.stringify(updatedUser));
          const usersKey = "medstudent_mock_users";
          let users = JSON.parse(localStorage.getItem(usersKey) || "[]");
          users = users.map((u: any) => u.id === user.id ? { ...u, ...updatedUser } : u);
          localStorage.setItem(usersKey, JSON.stringify(users));
          this.triggerAuthChange("USER_UPDATED", updatedUser);
          return { data: { user: updatedUser }, error: null };
        } catch (e: any) {
          return { data: { user: null }, error: e };
        }
      }
      return { data: { user: null }, error: new Error("No session active.") };
    },
    signOut: async () => {
      localStorage.removeItem("medstudent_mock_session");
      this.triggerAuthChange("SIGNED_OUT", null);
      return { error: null };
    },
    signInWithOAuth: async (args: any) => {
      // Simulate successful OAuth login for sandbox mode
      const mockUser = DEFAULT_USERS[1]; // Log in as the pre-configured clinical lead for demo
      localStorage.setItem("medstudent_mock_session", JSON.stringify(mockUser));
      this.triggerAuthChange("SIGNED_IN", mockUser);
      
      // Simulate the redirect behavior
      if (typeof window !== "undefined") {
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 800);
      }
      
      return { 
        data: { 
          provider: args.provider, 
          url: typeof window !== "undefined" ? window.location.origin : "" 
        }, 
        error: null 
      };
    },
    onAuthStateChange: (callback: any) => {
      this.authListeners.push(callback);
      const session = localStorage.getItem("medstudent_mock_session");
      if (session) {
        try {
          const user = JSON.parse(session);
          callback("INITIAL_SESSION", { user, access_token: "mock-token" });
        } catch {
          callback("INITIAL_SESSION", null);
        }
      } else {
        callback("INITIAL_SESSION", null);
      }
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              this.authListeners = this.authListeners.filter(l => l !== callback);
            }
          }
        }
      };
    }
  };

  private authListeners: any[] = [];
  private triggerAuthChange(event: string, user: any) {
    this.authListeners.forEach(l => l(event, user ? { user, access_token: "mock-token" } : null));
  }

  from(table: string) {
    return new MockQueryBuilder(table);
  }

  channel(name: string) {
    return new MockChannel(name);
  }

  removeChannel(channel: any) {
    // mock noop for channel cleanup
  }

  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: File, options?: any) => {
        const seed = path.split("/").pop() || "user";
        const url = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
        return { data: { path }, error: null };
      },
      getPublicUrl: (path: string) => {
        const seed = path.split("/").pop()?.split(".")[0] || "avatar";
        const publicUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`;
        return { data: { publicUrl } };
      }
    })
  };
}

let clientInstance: any = null;

export function createClient() {
  if (!clientInstance) {
    if (isConfigured) {
      console.log("[MedStudent] Connecting to live Supabase project.");
      clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey);
    } else {
      console.warn("[MedStudent] Supabase target unconfigured. Using high-fidelity Mock Sandbox Mode.");
      clientInstance = new MockSupabaseClient();
    }
  }
  return clientInstance;
}

export const supabase = createClient();
