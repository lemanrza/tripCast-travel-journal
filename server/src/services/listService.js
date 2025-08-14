const TravelListModel = require("../models/travelListModel.js");
const UserModel = require("../models/userModel.js");

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

        // Validate required fields
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

exports.addCollaborator = async (listId, collaboratorEmail, userId) => {
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
                message: "Only the owner can add collaborators",
            };
        }

        // Find the collaborator by email
        const collaborator = await UserModel.findOne({ email: collaboratorEmail });

        if (!collaborator) {
            return {
                success: false,
                message: "User with this email not found",
            };
        }

        // Check if user is trying to add themselves
        if (collaborator._id.toString() === userId) {
            return {
                success: false,
                message: "You cannot add yourself as a collaborator",
            };
        }

        // Check if user is already a collaborator
        if (list.collaborators.includes(collaborator._id)) {
            return {
                success: false,
                message: "User is already a collaborator",
            };
        }

        // Add collaborator to list
        list.collaborators.push(collaborator._id);
        await list.save();

        // Add list to collaborator's lists
        await UserModel.findByIdAndUpdate(collaborator._id, {
            $push: { lists: listId }
        });

        const updatedList = await TravelListModel.findById(listId)
            .populate("owner", "fullName email profileImage")
            .populate("collaborators", "fullName email profileImage")
            .populate("destinations");

        return {
            success: true,
            data: updatedList,
            message: "Collaborator added successfully!",
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
