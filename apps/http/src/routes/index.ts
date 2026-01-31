import { Router } from "express";
import { createClient } from "redis";

const redisClient = createClient();

(async () => {
  await redisClient.connect();
})();

const router: Router = Router();

router.post("/join-meeting", async (req, res) => {
  const userId = req.userId; //@ts-ignore
  const { link } = req.body;
  //update in db link from user with timestamp
  //push on to queue
  await redisClient.rPush("join_meet_queue", JSON.stringify({ userId, link }));
  //update status of request from the docker manager process
  
});

export { router as v1Router };
