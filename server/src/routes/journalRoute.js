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
const {
    getCommentsByJournal,
    createComment,
    updateComment,
    deleteComment,
} = require("../controllers/commentController.js");

const journalRouter = express.Router();

// All routes require authentication
journalRouter.use(authenticateToken);

// Journal routes
journalRouter.get("/", getAllJournals);
journalRouter.get("/list/:listId", getJournalsByListId);
journalRouter.get("/:id", getJournalById);
journalRouter.post("/", createJournal);
journalRouter.put("/:id", updateJournal);
journalRouter.delete("/:id", deleteJournal);
journalRouter.post("/:id/like", toggleJournalLike);

// Comment routes
journalRouter.get("/:journalId/comments", getCommentsByJournal);
journalRouter.post("/:journalId/comments", createComment);
journalRouter.put("/comments/:commentId", updateComment);
journalRouter.delete("/comments/:commentId", deleteComment);

module.exports = journalRouter;
