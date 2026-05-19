// database/init.js
// Runs once when the MongoDB container is first created.

db = db.getSiblingDB("taskmanager");

// ── Collections ─────────────────────────────────────
db.createCollection("users");
db.createCollection("tasks");

// ── Indexes ──────────────────────────────────────────
db.users.createIndex({ email: 1 }, { unique: true });
db.tasks.createIndex({ userId: 1 });
db.tasks.createIndex({ dueDate: 1 });
db.tasks.createIndex({ status: 1 });

// ── Seed: demo user (password: "demo1234") ───────────
db.users.insertOne({
  name: "Demo User",
  email: "demo@taskmanager.dev",
  // bcrypt hash of "demo1234"
  password: "$2b$10$KIp4l5JQ2YmW8OdNM/1cgu9QwJQH1Rf8OBzFXpZXh6K3VFT0MmEMO",
  createdAt: new Date(),
});

print("✅  taskmanager DB initialised");
