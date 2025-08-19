const { default: mongoose } = require("mongoose");
const GroupModel = require("../models/groupModel.js");
const TravelListModel = require("../models/travelListModel.js");
const UserModel = require("../models/userModel.js");
const { buildRegexQuery } = require("../utils/regex.js");


exports.searchListsService = async (opts) => {
    const {
        q,
        page = 1,
        limit = 10,
        filter = {},
        select = "title description tags isPublic owner coverImage createdAt",
    } = opts;

    const query = { ...filter, ...buildRegexQuery(q, ["title", "description", "tags"]) };
    const safeLimit = Math.min(Math.max(limit, 1), 50);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
        TravelListModel.find(query).select(select).skip(skip).limit(safeLimit).sort({ createdAt: -1 }).lean().exec(),
        TravelListModel.countDocuments(query),
    ]);

    return { data: items, total, page: safePage, limit: safeLimit };
}

exports.getAll = async () => {
    return await TravelListModel.find()
        .populate("owner", "fullName email profileImage")
        .populate("collaborators", "fullName email profileImage")
        .populate("destinations")
        .sort({ createdAt: -1 });
};

exports.getOne = async (listId, userId) => {
    const list = await TravelListModel.findById(listId)
        .populate("owner", "fullName email profileImage")
        .populate("collaborators", "fullName email profileImage")
        .populate("destinations");

    if (!list) {
        throw new Error("Travel list not found");
    }
    return list;
};

exports.getUserLists = async (userId) => {
    return await TravelListModel.find({ owner: userId })
        .populate("owner", "fullName email profileImage")
        .populate("collaborators", "fullName email profileImage")
        .populate("destinations")
        .sort({ createdAt: -1 });
};

exports.getCollaborativeLists = async (userId) => {
    return await TravelListModel.find({
        collaborators: { $in: [userId] },
        owner: { $ne: userId }
    })
        .populate("owner", "fullName email profileImage")
        .populate("collaborators", "fullName email profileImage")
        .populate("destinations")
        .sort({ createdAt: -1 });
};

exports.create = async (payload, userId) => {
    try {
        const { title, description, tags, isPublic, coverImage } = payload;

        if (!title || !description) {
            return {
                success: false,
                message: "Title and description are required",
            };
        }

        const newList = await TravelListModel.create({
            title,
            description,
            tags: tags || [],
            isPublic: isPublic !== undefined ? isPublic : true,
            owner: userId,
            coverImage: coverImage || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
            collaborators: [],
            destinations: [],
        });

        // Add list to user's lists array
        await UserModel.findByIdAndUpdate(userId, {
            $push: { lists: newList._id }
        });

        const populatedList = await TravelListModel.findById(newList._id)
            .populate("owner", "fullName email profileImage")
            .populate("collaborators", "fullName email profileImage")
            .populate("destinations");

        return {
            success: true,
            data: populatedList,
            message: "Travel list created successfully!",
        };
    } catch (error) {
        let message = "Internal server error";
        if (error && typeof error === "object" && "message" in error) {
            message = error.message;
        }
        return {
            success: false,
            message: message,
        };
    }
};

exports.update = async (listId, payload, userId) => {
    try {
        const list = await TravelListModel.findById(listId);

        if (!list) {
            return {
                success: false,
                message: "Travel list not found",
            };
        }

        // Check if user is the owner
        if (list.owner.toString() !== userId) {
            return {
                success: false,
                message: "You can only update your own travel lists",
            };
        }

        const { title, description, tags, isPublic, coverImage } = payload;

        const updateData = {};
        if (title) updateData.title = title;
        if (description) updateData.description = description;
        if (tags !== undefined) updateData.tags = tags;
        if (isPublic !== undefined) updateData.isPublic = isPublic;
        if (coverImage) updateData.coverImage = coverImage;

        const updatedList = await TravelListModel.findByIdAndUpdate(
            listId,
            updateData,
            { new: true }
        )
            .populate("owner", "fullName email profileImage")
            .populate("collaborators", "fullName email profileImage")
            .populate("destinations");

        return {
            success: true,
            data: updatedList,
            message: "Travel list updated successfully!",
        };
    } catch (error) {
        let message = "Internal server error";
        if (error && typeof error === "object" && "message" in error) {
            message = error.message;
        }
        return {
            success: false,
            message: message,
        };
    }
};

exports.delete = async (listId, userId) => {
    try {
        const list = await TravelListModel.findById(listId);

        if (!list) {
            return {
                success: false,
                message: "Travel list not found",
            };
        }

        if (list.owner.toString() !== userId) {
            return {
                success: false,
                message: "You can only delete your own travel lists",
            };
        }

        await UserModel.findByIdAndUpdate(userId, {
            $pull: { lists: listId }
        });

        if (list.collaborators.length > 0) {
            await UserModel.updateMany(
                { _id: { $in: list.collaborators } },
                { $pull: { lists: listId } }
            );
        }

        await TravelListModel.findByIdAndDelete(listId);

        return {
            success: true,
            message: "Travel list deleted successfully!",
        };
    } catch (error) {
        let message = "Internal server error";
        if (error && typeof error === "object" && "message" in error) {
            message = error.message;
        }
        return {
            success: false,
            message: message,
        };
    }
};

exports.addDestination = async (listId, destinationId, userId) => {
    try {
        const list = await TravelListModel.findById(listId);

        if (!list) {
            return {
                success: false,
                message: "Travel list not found",
            };
        }

        // Check if user has write access (owner or collaborator)
        const hasWriteAccess = list.owner.toString() === userId ||
            list.collaborators.includes(userId);

        if (!hasWriteAccess) {
            return {
                success: false,
                message: "You don't have permission to add destinations to this list",
            };
        }

        // Check if destination is already in the list
        if (list.destinations.includes(destinationId)) {
            return {
                success: false,
                message: "Destination is already in this list",
            };
        }

        // Add destination to list
        list.destinations.push(destinationId);
        await list.save();

        const updatedList = await TravelListModel.findById(listId)
            .populate("owner", "fullName email profileImage")
            .populate("collaborators", "fullName email profileImage")
            .populate("destinations");

        return {
            success: true,
            data: updatedList,
            message: "Destination added to list successfully!",
        };
    } catch (error) {
        let message = "Internal server error";
        if (error && typeof error === "object" && "message" in error) {
            message = error.message;
        }
        return {
            success: false,
            message: message,
        };
    }
};

exports.removeDestination = async (listId, destinationId, userId) => {
    try {
        const list = await TravelListModel.findById(listId);

        if (!list) {
            return {
                success: false,
                message: "Travel list not found",
            };
        }

        // Check if user has write access (owner or collaborator)
        const hasWriteAccess = list.owner.toString() === userId ||
            list.collaborators.includes(userId);

        if (!hasWriteAccess) {
            return {
                success: false,
                message: "You don't have permission to remove destinations from this list",
            };
        }

        // Check if destination exists in the list
        if (!list.destinations.includes(destinationId)) {
            return {
                success: false,
                message: "Destination is not in this list",
            };
        }

        // Remove destination from list
        list.destinations = list.destinations.filter(
            id => id.toString() !== destinationId
        );
        await list.save();

        const updatedList = await TravelListModel.findById(listId)
            .populate("owner", "fullName email profileImage")
            .populate("collaborators", "fullName email profileImage")
            .populate("destinations");

        return {
            success: true,
            data: updatedList,
            message: "Destination removed from list successfully!",
        };
    } catch (error) {
        let message = "Internal server error";
        if (error && typeof error === "object" && "message" in error) {
            message = error.message;
        }
        return {
            success: false,
            message: message,
        };
    }
};

exports.addCollaborator = async (listId, collaboratorEmail, userId) => {
    try {
        const list = await TravelListModel.findById(listId);
        if (!list) {
            return { success: false, message: "Travel list not found" };
        }

        // Only owner can invite
        if (String(list.owner) !== String(userId)) {
            return { success: false, message: "Only the owner can add collaborators" };
        }

        // Find invitee by email
        const collaborator = await UserModel.findOne({ email: collaboratorEmail });
        if (!collaborator) {
            return { success: false, message: "User with this email not found" };
        }

        if (String(collaborator._id) === String(userId)) {
            return { success: false, message: "You cannot add yourself as a collaborator" };
        }

        // Already a collaborator (or owner)?
        const alreadyCollab =
            String(list.owner) === String(collaborator._id) ||
            (list.collaborators || []).some((id) => String(id) === String(collaborator._id));
        if (alreadyCollab) {
            return { success: false, message: "User is already a collaborator" };
        }

        // Duplicate pending invite?
        const hasPending = (collaborator.collaboratorsRequest || []).some(
            (r) => String(r.fromUser) === String(userId) && String(r.list) === String(listId)
        );
        if (hasPending) {
            return { success: false, message: "Invite already sent" };
        }

        // Push invite to invitee's inbox
        collaborator.collaboratorsRequest.push({ fromUser: userId, list: list._id });
        await collaborator.save();

        // Return hydrated list (unchanged; you may not need it for the invite flow)
        const updatedList = await TravelListModel.findById(listId)
            .populate("owner", "fullName email profileImage")
            .populate("collaborators", "fullName email profileImage")
            .populate("destinations");

        return {
            success: true,
            data: updatedList,
            message: "Invitation sent successfully!",
        };
    } catch (error) {
        return {
            success: false,
            message: error?.message || "Internal server error",
        };
    }
};

exports.removeCollaborator = async (listId, collaboratorId, userId) => {
    try {
        const list = await TravelListModel.findById(listId);

        if (!list) {
            return {
                success: false,
                message: "Travel list not found",
            };
        }

        // Check if user is the owner
        if (list.owner.toString() !== userId) {
            return {
                success: false,
                message: "Only the owner can remove collaborators",
            };
        }

        // Check if the collaborator exists in the list
        if (!list.collaborators.includes(collaboratorId)) {
            return {
                success: false,
                message: "User is not a collaborator",
            };
        }

        // Remove collaborator from list
        list.collaborators = list.collaborators.filter(
            id => id.toString() !== collaboratorId
        );
        await list.save();

        // Remove list from collaborator's lists
        await UserModel.findByIdAndUpdate(collaboratorId, {
            $pull: { lists: listId }
        });

        const updatedList = await TravelListModel.findById(listId)
            .populate("owner", "fullName email profileImage")
            .populate("collaborators", "fullName email profileImage")
            .populate("destinations");

        return {
            success: true,
            data: updatedList,
            message: "Collaborator removed successfully!",
        };
    } catch (error) {
        let message = "Internal server error";
        if (error && typeof error === "object" && "message" in error) {
            message = error.message;
        }
        return {
            success: false,
            message: message,
        };
    }
};

exports.getMyCollaboratorRequests = async (userId) => {
    try {
        const me = await UserModel.findById(userId)
            .select("collaboratorsRequest")
            .populate({ path: "collaboratorsRequest.fromUser", select: "fullName email profileImage" })
            .populate({ path: "collaboratorsRequest.list", select: "title coverImage owner" });

        return { success: true, data: me?.collaboratorsRequest || [] };
    } catch (error) {
        return { success: false, message: error?.message || "Internal server error" };
    }
};

exports.acceptCollaboratorRequest = async (userId, requestId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const me = await UserModel.findById(userId).session(session);
        if (!me) throw new Error("User not found");

        const reqDoc = me.collaboratorsRequest.id(requestId);
        if (!reqDoc) throw new Error("Request not found");

        const listId = reqDoc.list;
        const list = await TravelListModel.findById(listId).session(session);
        if (!list) {
            reqDoc.deleteOne();
            await me.save({ session });
            await session.commitTransaction();
            return { success: false, message: "List not found; request removed" };
        }

        if (String(list.owner) !== String(userId)) {
            await TravelListModel.updateOne(
                { _id: listId },
                { $addToSet: { collaborators: userId } },
                { session }
            );
        }

        await UserModel.updateOne(
            { _id: userId },
            { $addToSet: { lists: listId } },
            { session }
        );

        if (list.group) {
            await GroupModel.updateOne(
                { _id: list.group },
                { $addToSet: { members: userId } },
                { session }
            );
        }

        me.collaboratorsRequest.id(requestId)?.deleteOne();
        await me.save({ session });

        await session.commitTransaction();

        const hydrated = await TravelListModel
            .findById(listId)
            .populate("owner", "fullName email profileImage")
            .populate("collaborators", "fullName email profileImage")
            .populate("destinations");

        return { success: true, message: "Joined as collaborator", data: hydrated };
    } catch (error) {
        await session.abortTransaction();
        return { success: false, message: error?.message || "Internal server error" };
    } finally {
        session.endSession();
    }
};

exports.rejectCollaboratorRequest = async (userId, requestId) => {
    try {
        const me = await UserModel.findById(userId);
        if (!me) return { success: false, message: "User not found" };

        const reqDoc = me.collaboratorsRequest.id(requestId);
        if (!reqDoc) return { success: false, message: "Request not found" };

        reqDoc.deleteOne();
        await me.save();

        return { success: true, message: "Invite dismissed" };
    } catch (error) {
        return { success: false, message: error?.message || "Internal server error" };
    }
};

exports.enableChat = async (listId, userId) => {
    try {
        const list = await TravelListModel.findById(listId).lean();
        if (!list) return { success: false, message: "Travel list not found" };

        const isOwner = String(list.owner) === String(userId);
        const isCollaborator = (list.collaborators || []).some(
            (id) => String(id) === String(userId)
        );

        if (!isOwner && !isCollaborator) {
            return { success: false, message: "Only owner/collaborators can enable chat" };
        }

        if (!list.collaborators || list.collaborators.length < 1) {
            return { success: false, message: "Add at least one collaborator to enable chat" };
        }

        if (list.group) {
            return { success: true, data: { group: list.group }, message: "Chat already enabled" };
        }

        // create Group with owner as admin and all collaborators as members
        const uniqueMembers = Array.from(
            new Set([String(list.owner), ...(list.collaborators || []).map(String)])
        ).map((id) => new mongoose.Types.ObjectId(id));

        const group = await GroupModel.create({
            name: list.title,
            members: uniqueMembers,
            admins: [list.owner],
        });

        await TravelListModel.findByIdAndUpdate(listId, { group: group._id });

        return { success: true, data: { group: group._id }, message: "Chat enabled" };
    } catch (err) {
        return { success: false, message: err?.message || "Internal server error" };
    }
};