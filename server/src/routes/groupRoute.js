const { update, getById, getAll } = require("../controllers/groupController");
// const requireAuth = require("../middleware/requireAuth");

// routes/group.routes.js
const router = require("express").Router();


router.get("/", getAll);
router.get("/:id", getById);
// router.use(requireAuth);
router.put("/:id", update);

module.exports = router;
