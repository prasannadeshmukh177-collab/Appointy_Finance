import express, { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { addDays, addWeeks, addMonths, addYears, format, parseISO, isBefore, isSameDay } from "date-fns";

const app = express();

// 1. Basic Health Check (Always works)
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

app.get("/api/ping", (req, res) => {
  res.json({ 
    status: "online", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV 
  });
});

// 2. Config Check (Helps you debug)
app.get("/api/config-check", (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL ? "✅ Configured" : "❌ MISSING",
    supabaseKey: (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY) ? "✅ Configured" : "❌ MISSING",
    adminPassword: process.env.ADMIN_PASSWORD ? "✅ Configured" : "❌ MISSING",
    jwtSecret: process.env.JWT_SECRET ? "✅ Configured" : "⚠️ Using Default (Unsafe)",
    isVercel: !!process.env.VERCEL
  });
});

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || "fallback_secret_for_dev";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// Supabase Lazy Loader
let _supabase: any = null;
const getSupabase = () => {
  if (_supabase) return _supabase;
  
  const url = process.env.SUPABASE_URL || 
              process.env.VITE_SUPABASE_URL || 
              'https://lwrkfhoxsbxtpkrgiula.supabase.co';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 
             process.env.SUPABASE_ANON_KEY || 
             process.env.SUPABASE_SECRET_KEY ||
             process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  try {
    _supabase = createClient(url, key);
    return _supabase;
  } catch (err) {
    return null;
  }
};

app.use(express.json());
app.use(cookieParser());

// Auth Middleware
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// --- API ROUTES ---

app.post("/api/login", (req, res) => {
  const { password } = req.body;
  if (!ADMIN_PASSWORD) {
    console.error("ADMIN_PASSWORD is not set in environment variables");
    return res.status(500).json({ error: "Server configuration error: ADMIN_PASSWORD missing" });
  }
  
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.json({ success: true });
  }
  res.status(401).json({ error: "Invalid credentials" });
});

app.post("/api/logout", (req, res) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });
  res.json({ success: true });
});

app.get("/api/auth/me", (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.json({ authenticated: false });
  try {
    jwt.verify(token, JWT_SECRET);
    res.json({ authenticated: true });
  } catch (error) {
    res.json({ authenticated: false });
  }
});

app.get("/api/tasks", async (req, res) => {
  const { month, year } = req.query;
  const s = getSupabase();
  if (!s) return res.status(500).json({ error: "Supabase not configured in Environment Variables" });

  try {
    let query = s.from("tasks").select("*, subtasks(*)");
    if (month && year) {
      query = query.gte("date", `${year}-${month}-01`).lte("date", `${year}-${month}-31`);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ... (Rest of the routes follow the same pattern)
app.post("/api/tasks", authenticate, async (req, res) => {
  const { subtasks, ...taskData } = req.body;
  const s = getSupabase();
  if (!s) return res.status(500).json({ error: "Supabase not configured" });
  try {
    const { data: insertedTasks, error: taskError } = await s.from("tasks").insert([taskData]).select();
    if (taskError) throw taskError;
    
    const newTask = insertedTasks?.[0];
    if (newTask && subtasks && Array.isArray(subtasks) && subtasks.length > 0) {
      const subtasksToInsert = subtasks.map(st => ({
        ...st,
        task_id: newTask.id
      }));
      const { error: subtaskError } = await s.from("subtasks").insert(subtasksToInsert);
      if (subtaskError) console.error("Error inserting subtasks:", subtaskError);
    }
    
    res.status(201).json(newTask || {});
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.patch("/api/tasks/:id", authenticate, async (req, res) => {
  const { subtasks, ...updateData } = req.body;
  const s = getSupabase();
  if (!s) return res.status(500).json({ error: "Supabase not configured" });
  try {
    const { error } = await s.from("tasks").update(updateData).eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.patch("/api/subtasks/:id", async (req, res) => {
  const s = getSupabase();
  if (!s) return res.status(500).json({ error: "Supabase not configured" });
  try {
    const { error } = await s.from("subtasks").update(req.body).eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

app.delete("/api/tasks/:id", authenticate, async (req, res) => {
  const s = getSupabase();
  if (!s) return res.status(500).json({ error: "Supabase not configured" });
  try {
    const { error } = await s.from("tasks").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// Global Error Handler (MUST BE LAST)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

export default app;
