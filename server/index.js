const path = require("path");
const express = require("express");
const store = require("./store");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/vor", (req, res) => {
  res.json(store.list());
});

app.get("/api/vor/:ref", (req, res) => {
  const rec = store.get(req.params.ref);
  if (!rec) return res.status(404).json({ error: "not found" });
  res.json(rec);
});

app.post("/api/vor", (req, res) => {
  const rec = req.body;
  if (!rec || typeof rec !== "object" || !rec.ref) {
    return res.status(400).json({ error: "missing ref" });
  }
  try {
    const saved = store.create(rec);
    res.status(201).json(saved);
  } catch (err) {
    res.status(409).json({ error: err.message });
  }
});

app.patch("/api/vor/:ref", (req, res) => {
  const saved = store.update(req.params.ref, req.body || {});
  if (!saved) return res.status(404).json({ error: "not found" });
  res.json(saved);
});

app.listen(PORT, () => {
  console.log(`Web VOR server listening on port ${PORT}`);
});
