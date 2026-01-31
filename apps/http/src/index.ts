import express from "express";
import "dotenv/config";
import cors from "cors";
import { v1Router } from "./routes";

const app = express();

const PORT = process.env.HTTP_PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/health", (_req, res) => {
  res.status(200).send("OK");
});

app.use("/api/v1", v1Router);

app.listen(PORT, () => {
  console.log(`HTTP server is running on port ${PORT}`);
});
