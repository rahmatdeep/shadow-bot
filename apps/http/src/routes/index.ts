import { Router } from "express";
import { createClient } from "redis";
import { JoinMeetingPayload } from "@repo/types";

const redisClient = createClient();

(async () => {
  await redisClient.connect();
})();

const router: Router = Router();
router.get("/status", (_req, res) => {
  res.json({ status: "API is running" });
});

router.post("/join-meeting", async (req, res) => {
  const userId = "32";
  const { link } = req.body;
  //update in db link from user with timestamp
  //push on to queue
  const payload: JoinMeetingPayload = { userId, link };
  await redisClient.rPush("join_meet_queue", JSON.stringify(payload));
  //update status of request from the docker manager process
  res.json({ status: "queued" });
});

export { router as v1Router };
