import { Router } from "express";
import { chatRouter } from "./chat";
import { meetingRouter } from "./meeting";
import { queryRouter } from "./query";

const router: Router = Router();

router.get("/status", (_req, res) => {
  res.json({ status: "API is running" });
});

router.use("/chat", chatRouter);
router.use("/meeting", meetingRouter);
router.use("/query", queryRouter);

export { router as v1Router };
