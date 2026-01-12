import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to scores file
const SCORES_FILE = path.join(__dirname, "scores.json");

// Secret key for signing (change this in production!)
const SECRET_KEY = process.env.SECRET_KEY || "skill-card-game-secret-2024";

// Admin password for clearing leaderboard (change this in production!)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

interface ScoreRecord {
  playerName: string;
  time: number;
  timestamp: number;
}

interface GameSession {
  sessionId: string;
  startTime: number;
  expiresAt: number;
}

// In-memory session storage (use Redis in production)
const gameSessions = new Map<string, GameSession>();

// File operation queue for thread safety
let fileOperationQueue: Promise<void> = Promise.resolve();

/**
 * Queue file operations to prevent race conditions
 * Ensures all file reads/writes are serialized
 */
function queueFileOperation<T>(operation: () => Promise<T>): Promise<T> {
  const promise = fileOperationQueue
    .then(operation)
    .catch((error) => {
      console.error("File operation error:", error);
      throw error;
    });
  // Continue queue even if current operation fails
  fileOperationQueue = promise.then(() => {}, () => {});
  return promise;
}

// Generate session ID
function generateSessionId(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Create signature
function createSignature(data: string): string {
  return crypto.createHmac("sha256", SECRET_KEY).update(data).digest("hex");
}

// Verify signature
function verifySignature(data: string, signature: string): boolean {
  const expectedSignature = createSignature(data);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Clean expired sessions (run periodically)
function cleanExpiredSessions() {
  const now = Date.now();
  gameSessions.forEach((session, sessionId) => {
    if (session.expiresAt < now) {
      gameSessions.delete(sessionId);
    }
  });
}

// Initialize scores file if not exists
async function initScoresFile() {
  try {
    await fs.access(SCORES_FILE);
  } catch {
    // File doesn't exist, create it with empty array
    await fs.writeFile(SCORES_FILE, JSON.stringify([], null, 2));
    console.log("📝 Created scores.json file");
  }
}

// Read scores from file
async function getScores(): Promise<ScoreRecord[]> {
  try {
    const data = await fs.readFile(SCORES_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading scores:", error);
    return [];
  }
}

// Save scores to file
async function saveScores(scores: ScoreRecord[]): Promise<void> {
  try {
    // Sort by time (ascending) and keep top 100
    const sorted = scores.sort((a, b) => a.time - b.time).slice(0, 100);
    await fs.writeFile(SCORES_FILE, JSON.stringify(sorted, null, 2));
  } catch (error) {
    console.error("Error saving scores:", error);
    throw error;
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Parse JSON request bodies
  app.use(express.json());

  // Initialize scores file
  await initScoresFile();

  // Clean expired sessions every 5 minutes
  setInterval(cleanExpiredSessions, 5 * 60 * 1000);

  // API Routes
  // POST /api/game/start - Start new game session
  app.post("/api/game/start", (req, res) => {
    try {
      const sessionId = generateSessionId();
      const startTime = Date.now();
      const expiresAt = startTime + 15 * 60 * 1000; // 15 minutes

      const session: GameSession = {
        sessionId,
        startTime,
        expiresAt,
      };

      gameSessions.set(sessionId, session);

      console.log(`🎮 New game session: ${sessionId}`);

      res.json({
        sessionId,
        timestamp: startTime,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to start game session" });
    }
  });

  // GET /api/scores - Get leaderboard
  app.get("/api/scores", async (_req, res) => {
    try {
      const scores = await getScores();
      res.json(scores);
    } catch (error) {
      res.status(500).json({ error: "Failed to get scores" });
    }
  });

  // POST /api/scores - Submit new score (with session validation)
  app.post("/api/scores", async (req, res) => {
    try {
      const { playerName, time, sessionId } = req.body;

      // Validate input
      if (!playerName || typeof time !== "number" || !sessionId) {
        return res.status(400).json({ error: "Invalid score data" });
      }

      // Verify session exists and not expired
      const session = gameSessions.get(sessionId);
      if (!session) {
        return res.status(401).json({ error: "Invalid or expired session" });
      }

      const now = Date.now();
      if (session.expiresAt < now) {
        gameSessions.delete(sessionId);
        return res.status(401).json({ error: "Session expired" });
      }

      // Verify time is reasonable (must be after game started)
      // time is in milliseconds, so compare in milliseconds
      const gameElapsedTime = now - session.startTime;
      if (time > gameElapsedTime + 5000) {
        // Allow 5 seconds tolerance
        return res.status(401).json({ error: "Invalid game time" });
      }

      // Delete session after use (one-time use)
      gameSessions.delete(sessionId);

      // Create score record
      const newScore: ScoreRecord = {
        playerName: playerName.trim(),
        time,
        timestamp: now,
      };

      // Queue file operation to prevent race conditions
      await queueFileOperation(async () => {
        const scores = await getScores();
        scores.push(newScore);
        await saveScores(scores);
      });

      console.log(`✅ Score saved: ${playerName} - ${time}ms`);

      res.json({ success: true, score: newScore });
    } catch (error) {
      console.error("Error saving score:", error);
      res.status(500).json({ error: "Failed to save score" });
    }
  });

  // DELETE /api/scores - Clear leaderboard (admin only)
  app.delete("/api/scores", async (req, res) => {
    try {
      const { password } = req.body;

      // Verify admin password
      if (password !== ADMIN_PASSWORD) {
        return res.status(403).json({ error: "密码错误" });
      }

      // Queue file operation to prevent race conditions
      await queueFileOperation(async () => {
        await fs.writeFile(SCORES_FILE, JSON.stringify([], null, 2));
      });

      console.log(`🗑️ Leaderboard cleared by admin`);

      res.json({ success: true, message: "Leaderboard cleared" });
    } catch (error) {
      console.error("Error clearing leaderboard:", error);
      res.status(500).json({ error: "Failed to clear leaderboard" });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`📊 Leaderboard API: http://localhost:${port}/api/scores`);
  });
}

startServer().catch(console.error);
