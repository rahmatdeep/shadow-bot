import express from "express";
import path from "path";
import "dotenv/config";
import cors from "cors";
import { v1Router } from "./routes/v1";
import { authMiddleware } from "./middleware/auth";
import { authRouter } from "./routes/v1/auth";

const app = express();

const PORT = process.env.HTTP_PORT || 3000;

app.use(cors());
app.use(express.json());

const RECORDINGS_PATH = path.resolve(__dirname, "..", "..", "..", "recordings");
app.use("/recordings", express.static(RECORDINGS_PATH));

app.use("/health", (_req, res) => {
  res.status(200).send("OK");
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/status", (_req, res) => {
  res.json({ status: "API is running" });
});

app.use("/api/v1", authMiddleware, v1Router);

app.listen(PORT, () => {
  console.log(`HTTP server is running on port ${PORT}`);
});
