const commentService = require("../services/commentService");
const formatMongoData = require("../utils/formatMongoData");

// Get all comments for a specific journal entry
exports.getCommentsByJournal = async (req, res, next) => {
    try {
        const { journalId } = req.params;
        const userId = req.user._id;

        const result = await commentService.getCommentsByJournal(journalId, userId);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message,
            });
        }

        res.status(200).json({
            success: true,
            message: "Comments fetched successfully",
            data: formatMongoData(result.data),
        });
    } catch (error) {
        console.error("Get comments error:", error);
        next(error);
    }
};

// Create a new comment on a journal entry
exports.createComment = async (req, res, next) => {
    try {
        const { journalId } = req.params;
        const userId = req.user._id;
        const payload = req.body;

        const result = await commentService.createComment(journalId, payload, userId);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
            });
        }

        res.status(201).json({
            success: true,
            message: result.message,
            data: formatMongoData(result.data),
        });
    } catch (error) {
        console.error("Create comment error:", error);
        next(error);
    }
};

// Update a comment
exports.updateComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id;
        const payload = req.body;

        const result = await commentService.updateComment(commentId, payload, userId);

        if (!result.success) {
            const statusCode = result.message.includes("not found") ? 404 : 400;
            return res.status(statusCode).json({
                success: false,
                message: result.message,
            });
        }

        res.status(200).json({
            success: true,
            message: result.message,
            data: formatMongoData(result.data),
        });
    } catch (error) {
        console.error("Update comment error:", error);
        next(error);
    }
};

// Delete a comment
exports.deleteComment = async (req, res, next) => {
    try {
        const { commentId } = req.params;
        const userId = req.user._id;

        const result = await commentService.deleteComment(commentId, userId);

        if (!result.success) {
            const statusCode = result.message.includes("not found") ? 404 : 403;
            return res.status(statusCode).json({
                success: false,
                message: result.message,
            });
        }

        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        console.error("Delete comment error:", error);
        next(error);
    }
};
