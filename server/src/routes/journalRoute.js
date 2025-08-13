const express = require("express");
const authenticateToken = require("../middleware/authenticateToken.js");
const {
    getAllJournals,
    getJournalById,
    getJournalsByListId,
    createJournal,
    updateJournal,
    deleteJournal,
    toggleJournalLike,
} = require("../controllers/journalController.js");

const journalRouter = express.Router();

// All routes require authentication
journalRouter.use(authenticateToken);

journalRouter.get("/", getAllJournals);
journalRouter.get("/list/:listId", getJournalsByListId);
journalRouter.get("/:id", getJournalById);
journalRouter.post("/", createJournal);
journalRouter.put("/:id", updateJournal);
journalRouter.delete("/:id", deleteJournal);
journalRouter.post("/:id/like", toggleJournalLike);

module.exports = journalRouter;
