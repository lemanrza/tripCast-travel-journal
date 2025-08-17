const JournalEntryModel = require("../models/journalEntryModel.js");
const DestinationModel = require("../models/destinationModel.js");
const TravelListModel = require("../models/travelListModel.js");
const { buildRegexQuery } = require("../utils/regex.js");

exports.searchJournalsService = async (opts) => {
    const {
        q,
        page = 1,
        limit = 10,
        filter = {},
        select = "title content public destination createdAt author",
        withDestinationName = true,
    } = opts;

    const query = { ...filter, ...buildRegexQuery(q, ["title", "content"]) };
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    let qy = JournalEntryModel.find(query).select(select).skip(skip).limit(safeLimit).sort({ createdAt: -1 });

    if (withDestinationName) {
        qy = qy.populate({ path: "destination", select: "name" });
    }

    const [items, total] = await Promise.all([qy.lean().exec(), JournalEntryModel.countDocuments(query)]);

    return { data: items, total, page: safePage, limit: safeLimit };
}

exports.getAll = async (userId) => {
    const userLists = await TravelListModel.find({
        $or: [
            { owner: userId },
            { collaborators: { $in: [userId] } },
            { isPublic: true }
        ]
    }).select('_id');

    const listIds = userLists.map(list => list._id);

    const destinations = await DestinationModel.find({ listId: { $in: listIds } }).select('_id');
    const destinationIds = destinations.map(dest => dest._id);

    return await JournalEntryModel.find({ destination: { $in: destinationIds } })
        .populate("author", "fullName profileImage")
        .populate("destination", "name country")
        .sort({ createdAt: -1 });
};

exports.getOne = async (journalId, userId) => {
    const journal = await JournalEntryModel.findById(journalId)
        .populate("author", "fullName profileImage")
        .populate("destination", "name country listId");

    if (!journal) {
        throw new Error("Journal entry not found");
    }

    // Check if user has access to this journal
    const list = await TravelListModel.findById(journal.destination.listId);
    if (!list) {
        throw new Error("Associated travel list not found");
    }

    const hasAccess = journal.public ||
        list.isPublic ||
        list.owner.toString() === userId.toString() ||
        list.collaborators.some(collaborator => collaborator.toString() === userId.toString()) ||
        journal.author._id.toString() === userId.toString();

    if (!hasAccess) {
        throw new Error("You don't have access to this journal entry");
    }

    return journal;
};

exports.getByListId = async (listId, userId) => {
    const list = await TravelListModel.findById(listId);
    if (!list) {
        throw new Error("Travel list not found");
    }

    const hasAccess = list.isPublic ||
        list.owner.toString() === userId.toString() ||
        list.collaborators.some(collaborator => collaborator.toString() === userId.toString());

    if (!hasAccess) {
        throw new Error("You don't have access to this travel list");
    }

    const destinations = await DestinationModel.find({ listId: listId }).select('_id');
    const destinationIds = destinations.map(dest => dest._id);

    return await JournalEntryModel.find({ destination: { $in: destinationIds } })
        .populate("author", "fullName profileImage")
        .populate("destination", "name country")
        .sort({ createdAt: -1 });
};

exports.create = async (payload, userId) => {
    try {
        const { title, content, photos, destination, public: isPublic, listId } = payload;

        if (!title || !content || !destination) {
            return {
                success: false,
                message: "Title, content, and destination are required",
            };
        }

        // Verify destination exists
        const destinationDoc = await DestinationModel.findById(destination);
        if (!destinationDoc) {
            return {
                success: false,
                message: "Destination not found",
            };
        }

        // Verify travel list exists
        const list = await TravelListModel.findById(destinationDoc.listId);
        if (!list) {
            return {
                success: false,
                message: "Associated travel list not found",
            };
        }

        // Create journal
        const journalData = {
            title,
            content,
            photos: photos || [],
            destination,
            author: userId,
            public: isPublic || false,
        };

        const journal = await JournalEntryModel.create(journalData);

        destinationDoc.journals.push(journal._id);
        await destinationDoc.save();

        const populatedJournal = await JournalEntryModel.findById(journal._id)
            .populate("author", "fullName profileImage")
            .populate("destination", "name country");

        return {
            success: true,
            message: "Journal entry created and linked to destination successfully",
            data: populatedJournal,
        };
    } catch (error) {
        console.error("Journal creation error:", error);
        return {
            success: false,
            message: error.message || "Failed to create journal entry",
        };
    }
};

exports.update = async (journalId, payload, userId) => {
    try {
        const { title, content, photos, public: isPublic } = payload;

        const journal = await JournalEntryModel.findById(journalId);
        if (!journal) {
            return {
                success: false,
                message: "Journal entry not found",
            };
        }

        // Check if user is the author
        if (journal.author.toString() !== userId.toString()) {
            return {
                success: false,
                message: "You can only edit your own journal entries",
            };
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;
        if (photos !== undefined) updateData.photos = photos;
        if (isPublic !== undefined) updateData.public = isPublic;

        const updatedJournal = await JournalEntryModel.findByIdAndUpdate(
            journalId,
            updateData,
            { new: true, runValidators: true }
        ).populate("author", "fullName profileImage")
            .populate("destination", "name country");

        return {
            success: true,
            message: "Journal entry updated successfully",
            data: updatedJournal,
        };
    } catch (error) {
        console.error("Journal update error:", error);
        return {
            success: false,
            message: error.message || "Failed to update journal entry",
        };
    }
};

exports.delete = async (journalId, userId) => {
    try {
        const journal = await JournalEntryModel.findById(journalId);
        if (!journal) {
            return {
                success: false,
                message: "Journal entry not found",
            };
        }

        const destination = await DestinationModel.findById(journal.destination);
        const list = await TravelListModel.findById(destination.listId);

        const canDelete = journal.author.toString() === userId.toString() ||
            list.owner.toString() === userId.toString();

        if (!canDelete) {
            return {
                success: false,
                message: "You don't have permission to delete this journal entry",
            };
        }

        await JournalEntryModel.findByIdAndDelete(journalId);

        return {
            success: true,
            message: "Journal entry deleted successfully",
        };
    } catch (error) {
        console.error("Journal deletion error:", error);
        return {
            success: false,
            message: error.message || "Failed to delete journal entry",
        };
    }
};

exports.toggleLike = async (journalId, userId) => {
    try {
        const journal = await JournalEntryModel.findById(journalId);
        if (!journal) {
            return {
                success: false,
                message: "Journal entry not found",
            };
        }

        const likeIndex = journal.likes.findIndex(like => like.userId.toString() === userId.toString());

        if (likeIndex > -1) {
            journal.likes.splice(likeIndex, 1);
        } else {
            journal.likes.push({ userId: userId, createdAt: new Date() });
        }
        await journal.save();

        return {
            success: true,
            message: likeIndex > -1 ? "Like removed" : "Journal liked",
            data: { likesCount: journal.likes.length, isLiked: likeIndex === -1 },
        };
    } catch (error) {
        console.error("Journal like toggle error:", error);
        return {
            success: false,
            message: error.message || "Failed to toggle like",
        };
    }
};
