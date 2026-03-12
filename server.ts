import app from "./src/backend/app";
import express from "express";

const PORT = process.env.PORT || 3000;

async function setupVite(app: express.Express) {
  if (process.env.NODE_ENV === "production") {
    app.use(express.static("dist"));
    const path = await import("path");
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api/")) return; // Don't catch API routes
      res.sendFile(path.resolve("dist", "index.html"));
    });
    console.log("Production static serving enabled");
  } else {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware integrated");
    } catch (err) {
      console.error("Failed to setup Vite middleware:", err);
      app.use(express.static("dist"));
    }
  }
}

async function startServer() {
  try {
    const dotenv = await import("dotenv");
    dotenv.config();
    
    await setupVite(app);
    
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
}

startServer();
