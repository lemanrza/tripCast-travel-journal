// controllers/group.controller.js
const { getAll, getById, update } = require("../services/groupService");

exports.getAll = async (req, res) => {
  try {
    const data = await getAll();
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || "Failed to load groups" });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await getById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Group not found" });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message || "Failed to load group" });
  }
};

exports.update = async (req, res) => {
  try {
    const updated = await update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }
    res.json({ success: true, message: "Group updated", data: updated });
  } catch (e) {
    const code = e.status || 500;
    res.status(code).json({ success: false, message: e.message || "Failed to update group" });
  }
};
