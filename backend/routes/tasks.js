// backend/routes/tasks.js
const router = require("express").Router();
const { body, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const Task = require("../models/Task");
const axios = require("axios");

const NOTIFIER = process.env.NOTIFICATION_SERVICE_URL;

// All task routes require a valid JWT
router.use(auth);

// ── GET /api/tasks ────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const { status, priority, sort = "-createdAt" } = req.query;
    const filter = { userId: req.userId };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter).sort(sort);
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/tasks ───────────────────────────────────
router.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("priority").optional().isIn(["low", "medium", "high"]),
    body("dueDate").optional().isISO8601().toDate(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({ errors: errors.array() });

    try {
      const task = await Task.create({ ...req.body, userId: req.userId });
      res.status(201).json({ task });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /api/tasks/:id ────────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /api/tasks/:id ──────────────────────────────
router.patch("/:id", async (req, res, next) => {
  try {
    const allowed = ["title", "description", "status", "priority", "dueDate"];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Send email notification when a task is marked done
    if (updates.status === "done" && !task.notified) {
      try {
        await axios.post(`${NOTIFIER}/notify`, {
         to: (await (require("../models/User").findById(req.userId)))?.email,
          taskTitle: task.title,
          event: "completed",
        });
        await Task.findByIdAndUpdate(task._id, { notified: true });
      } catch {
        // Notification failure is non-fatal
      }
    }

    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/tasks/:id ─────────────────────────────
router.delete("/:id", async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
