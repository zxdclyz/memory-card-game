import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to scores file
const SCORES_FILE = path.join(__dirname, "scores.json");

interface ScoreRecord {
  playerName: string;
  time: number;
  timestamp: number;
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

  // API Routes
  // GET /api/scores - Get leaderboard
  app.get("/api/scores", async (_req, res) => {
    try {
      const scores = await getScores();
      res.json(scores);
    } catch (error) {
      res.status(500).json({ error: "Failed to get scores" });
    }
  });

  // POST /api/scores - Submit new score
  app.post("/api/scores", async (req, res) => {
    try {
      const { playerName, time } = req.body;

      // Validate input
      if (!playerName || typeof time !== "number") {
        return res.status(400).json({ error: "Invalid score data" });
      }

      // Get existing scores
      const scores = await getScores();

      // Add new score
      const newScore: ScoreRecord = {
        playerName: playerName.trim(),
        time,
        timestamp: Date.now(),
      };

      scores.push(newScore);

      // Save updated scores
      await saveScores(scores);

      res.json({ success: true, score: newScore });
    } catch (error) {
      res.status(500).json({ error: "Failed to save score" });
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
