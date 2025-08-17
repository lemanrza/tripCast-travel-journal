const CommentModel = require("../models/commentModel.js");
const JournalEntryModel = require("../models/journalEntryModel.js");
const TravelListModel = require("../models/travelListModel.js");
const DestinationModel = require("../models/destinationModel.js");
const mongoose = require("mongoose");

exports.getCommentsByJournal = async (journalId, userId) => {
    try {
        const journal = await JournalEntryModel.findById(journalId)
            .populate("destination");

        if (!journal) {
            throw new Error("Journal entry not found");
        }

        const destination = await DestinationModel.findById(journal.destination._id);
        const list = await TravelListModel.findById(destination.listId);

        if (!list) {
            throw new Error("Associated travel list not found");
        }

        const hasAccess = journal.public ||
            list.isPublic ||
            list.owner.toString() === userId.toString() ||
            list.collaborators.some(collaborator => collaborator.toString() === userId.toString()) ||
            journal.author.toString() === userId.toString();

        if (!hasAccess) {
            throw new Error("You don't have access to this journal entry");
        }

        const comments = await CommentModel.find({ journalEntry: journalId })
            .populate("authorId", "fullName profileImage")
            .sort({ createdAt: -1 });

        return {
            success: true,
            data: comments,
        };
    } catch (error) {
        console.error("Get comments error:", error);
        return {
            success: false,
            message: error.message || "Failed to fetch comments",
        };
    }
};

exports.createComment = async (journalId, payload, userId) => {
    try {
        const { content } = payload;

        if (!content || content.trim().length === 0) {
            return {
                success: false,
                message: "Comment content is required",
            };
        }

        const journal = await JournalEntryModel.findById(journalId)
            .populate("destination");

        if (!journal) {
            return {
                success: false,
                message: "Journal entry not found",
            };
        }

        const destination = await DestinationModel.findById(journal.destination._id);
        const list = await TravelListModel.findById(destination.listId);

        if (!list) {
            return {
                success: false,
                message: "Associated travel list not found",
            };
        }

        const hasAccess = journal.public ||
            list.isPublic ||
            list.owner.toString() === userId.toString() ||
            list.collaborators.some(collaborator => collaborator.toString() === userId.toString()) ||
            journal.author.toString() === userId.toString();

        if (!hasAccess) {
            return {
                success: false,
                message: "You don't have access to comment on this journal entry",
            };
        }

        const commentData = {
            content: content.trim(),
            authorId: userId,
            journalEntry: journalId,
        };

        const comment = await CommentModel.create(commentData);
        
        await JournalEntryModel.findByIdAndUpdate(
            journalId,
            { $push: { comments: comment._id } },
            { new: true }
        );

        const populatedComment = await CommentModel.findById(comment._id)
            .populate("authorId", "fullName profileImage");

        return {
            success: true,
            message: "Comment created successfully",
            data: populatedComment,
        };
    } catch (error) {
        console.error("Comment creation error:", error);
        return {
            success: false,
            message: error.message || "Failed to create comment",
        };
    }
};

exports.updateComment = async (commentId, payload, userId) => {
    try {
        const { content } = payload;

        if (!content || content.trim().length === 0) {
            return {
                success: false,
                message: "Comment content is required",
            };
        }

        const comment = await CommentModel.findById(commentId);
        if (!comment) {
            return {
                success: false,
                message: "Comment not found",
            };
        }

        // Check if user is the author of the comment
        if (comment.authorId.toString() !== userId.toString()) {
            return {
                success: false,
                message: "You can only edit your own comments",
            };
        }

        const updatedComment = await CommentModel.findByIdAndUpdate(
            commentId,
            { content: content.trim() },
            { new: true, runValidators: true }
        ).populate("authorId", "fullName profileImage");

        return {
            success: true,
            message: "Comment updated successfully",
            data: updatedComment,
        };
    } catch (error) {
        console.error("Comment update error:", error);
        return {
            success: false,
            message: error.message || "Failed to update comment",
        };
    }
};

exports.deleteComment = async (commentId, userId) => {
    try {
        console.log("Deleting comment with ID:", commentId);
        
        const comment = await CommentModel.findById(commentId);
        if (!comment) {
            return {
                success: false,
                message: "Comment not found",
            };
        }

        console.log("Found comment:", comment._id, "for journal:", comment.journalEntry);

        // Check if user is the author of the comment or the journal author
        const journal = await JournalEntryModel.findById(comment.journalEntry);
        const canDelete = comment.authorId.toString() === userId.toString() ||
            journal.author.toString() === userId.toString();

        if (!canDelete) {
            return {
                success: false,
                message: "You don't have permission to delete this comment",
            };
        }

        // Store the journalEntry ID before deleting the comment
        const journalEntryId = comment.journalEntry;

        // Delete the comment
        console.log("Deleting comment from Comment collection...");
        await CommentModel.findByIdAndDelete(commentId);

        // Remove the comment ID from the journal entry's comments array
        console.log("Removing comment from journal entry:", journalEntryId);
        console.log("Comment ID to remove:", commentId, typeof commentId);
        
        const updateResult = await JournalEntryModel.findByIdAndUpdate(
            journalEntryId,
            { $pull: { comments: commentId } },
            { new: true }
        );
        
        console.log("Journal update result:", updateResult ? "Success" : "Failed");
        if (updateResult) {
            console.log("Updated journal comments:", updateResult.comments);
        }
        
        console.log("Journal update result:", updateResult ? "Success" : "Failed");

        return {
            success: true,
            message: "Comment deleted successfully",
        };
    } catch (error) {
        console.error("Comment deletion error:", error);
        return {
            success: false,
            message: error.message || "Failed to delete comment",
        };
    }
};
