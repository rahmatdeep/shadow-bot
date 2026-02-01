import { Router } from "express";
import { createClient } from "redis";
import { JoinMeetingPayload } from "@repo/types";
import { prisma } from "@repo/db/client";

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

export { router as v1Router };
