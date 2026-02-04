import { Router } from "express";
import { createClient } from "redis";
import { JoinMeetingPayload } from "@repo/types";
import { prisma } from "@repo/db/client";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const redisClient = createClient();

(async () => {
  await redisClient.connect();
})();

const router: Router = Router();
router.get("/status", (_req, res) => {
  res.json({ status: "API is running" });
});

router.post("/join-meeting", async (req, res) => {
  const userId = "32"; //this is a mock user id
  const { link } = req.body;
  //update in db link from user with timestamp
  const recording = await prisma.recording.create({
    data: {
      userId,
      link,
    },
  });
  //push on to queue
  const payload: JoinMeetingPayload = { userId, link, recordingId: recording.id };

  await redisClient.rPush("join_meet_queue", JSON.stringify(payload));
  //update status of request from the docker manager process
  res.json({ status: "queued", recordingId: recording.id });
});

router.post("/chat", async (req, res) => {
  const { recordingId, message } = req.body;
  if (!recordingId || !message) {
    res.status(400).json({ error: "Missing recordingId or message" });
    return;
  }

  const transcript = await prisma.transcript.findUnique({
    where: { recordingId },
  });

  if (!transcript || !transcript.transcript) {
    res.status(404).json({ error: "Transcript not found" });
    return;
  }

  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-flash-latest",
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await model.invoke([
      new SystemMessage(`You are a helpful assistant answering questions about a meeting transcript. Use the following transcript as context:\n\n${transcript.transcript}`),
      new HumanMessage(message),
    ]);

    res.json({ response: response.content });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process chat request" });
  }
});

export { router as v1Router };
