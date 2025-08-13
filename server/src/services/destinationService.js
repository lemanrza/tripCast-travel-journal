const DestinationModel = require("../models/destinationModel.js");
const TravelListModel = require("../models/travelListModel.js");

exports.getAll = async (userId) => {
    const userLists = await TravelListModel.find({
        $or: [
            { owner: userId },
            { collaborators: { $in: [userId] } },
            { isPublic: true }
        ]
    }).select('_id');

    const listIds = userLists.map(list => list._id);

    return await DestinationModel.find({ listId: { $in: listIds } })
        .populate("listId", "title description owner collaborators")
        .sort({ createdAt: -1 });
};

exports.getOne = async (destinationId, userId) => {
    const destination = await DestinationModel.findById(destinationId)
        .populate("listId", "title description owner collaborators isPublic");

    if (!destination) {
        throw new Error("Destination not found");
    }

    const list = destination.listId;
    const hasAccess = list.isPublic ||
        list.owner.toString() === userId.toString() ||
        list.collaborators.some(collaborator => collaborator.toString() === userId.toString());

    if (!hasAccess) {
        throw new Error("You don't have access to this destination");
    }

    return destination;
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

    return await DestinationModel.find({ listId })
        .populate("listId", "title description")
        .sort({ createdAt: -1 });
};

exports.getUserDestinations = async (userId) => {
    const userLists = await TravelListModel.find({ owner: userId }).select('_id');
    const listIds = userLists.map(list => list._id);

    return await DestinationModel.find({ listId: { $in: listIds } })
        .populate("listId", "title description")
        .sort({ createdAt: -1 });
};

exports.create = async (payload, userId) => {
    try {
        const { name, country, datePlanned, dateVisited, status, notes, image, listId } = payload;

        if (!name || !country || !listId) {
            return {
                success: false,
                message: "Name, country, and list ID are required",
            };
        }

        const list = await TravelListModel.findById(listId);

        if (!list) {
            return {
                success: false,
                message: "Travel list not found",
            };
        }

        const hasWriteAccess = list.owner.toString() === userId.toString()

        if (!hasWriteAccess) {
            return {
                success: false,
                message: "You don't have permission to add destinations to this list",
            };
        }

        const newDestination = await DestinationModel.create({
            name,
            country,
            datePlanned,
            dateVisited: dateVisited || null,
            status: status || 'wishlist',
            notes: notes || '',
            image: image || null,
            listId,
        });

        await TravelListModel.findByIdAndUpdate(listId, {
            $push: { destinations: newDestination._id }
        });

        const populatedDestination = await DestinationModel.findById(newDestination._id)
            .populate("listId", "title description");

        return {
            success: true,
            data: populatedDestination,
            message: "Destination created successfully!",
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

exports.update = async (destinationId, payload, userId) => {
    try {
        const destination = await DestinationModel.findById(destinationId)
            .populate("listId", "owner collaborators");

        if (!destination) {
            return {
                success: false,
                message: "Destination not found",
            };
        }

        const list = destination.listId;
        const hasWriteAccess = list.owner.toString() === userId.toString()

        if (!hasWriteAccess) {
            return {
                success: false,
                message: "You don't have permission to update this destination",
            };
        }

        const { name, country, datePlanned, dateVisited, status, notes, image } = payload;

        const updateData = {};
        if (name) updateData.name = name;
        if (country) updateData.country = country;
        if (datePlanned) updateData.datePlanned = datePlanned;
        if (dateVisited !== undefined) updateData.dateVisited = dateVisited;
        if (status) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;
        if (image !== undefined) updateData.image = image;

        const updatedDestination = await DestinationModel.findByIdAndUpdate(
            destinationId,
            updateData,
            { new: true }
        ).populate("listId", "title description");

        return {
            success: true,
            data: updatedDestination,
            message: "Destination updated successfully!",
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

exports.delete = async (destinationId, userId) => {
    try {
        const destination = await DestinationModel.findById(destinationId)
            .populate("listId", "owner collaborators");

        if (!destination) {
            return {
                success: false,
                message: "Destination not found",
            };
        }

        const list = destination.listId;
        const hasWriteAccess = list.owner.toString() === userId.toString() ||
            list.collaborators.some(collaborator => collaborator.toString() === userId.toString());

        if (!hasWriteAccess) {
            return {
                success: false,
                message: "You don't have permission to delete this destination",
            };
        }

        await TravelListModel.findByIdAndUpdate(destination.listId._id, {
            $pull: { destinations: destinationId }
        });

        await DestinationModel.findByIdAndDelete(destinationId);

        return {
            success: true,
            message: "Destination deleted successfully!",
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

exports.updateStatus = async (destinationId, status, userId) => {
    try {
        const destination = await DestinationModel.findById(destinationId)
            .populate("listId", "owner collaborators");

        if (!destination) {
            return {
                success: false,
                message: "Destination not found",
            };
        }

        const list = destination.listId;
        const hasWriteAccess = list.owner.toString() === userId.toString() ||
            list.collaborators.some(collaborator => collaborator.toString() === userId.toString());

        if (!hasWriteAccess) {
            return {
                success: false,
                message: "You don't have permission to update this destination",
            };
        }

        const validStatuses = ['wishlist', 'planned', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return {
                success: false,
                message: "Invalid status. Must be one of: wishlist, planned, completed, cancelled",
            };
        }

        const updateData = { status };

        if (status === 'completed' && !destination.dateVisited) {
            updateData.dateVisited = new Date();
        }

        const updatedDestination = await DestinationModel.findByIdAndUpdate(
            destinationId,
            updateData,
            { new: true }
        ).populate("listId", "title description");

        return {
            success: true,
            data: updatedDestination,
            message: "Destination status updated successfully!",
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

exports.updateImage = async (destinationId, imageData, userId) => {
    try {
        const destination = await DestinationModel.findById(destinationId)
            .populate("listId", "owner collaborators");

        if (!destination) {
            return {
                success: false,
                message: "Destination not found",
            };
        }

        // Check if user has write access to the list
        const list = destination.listId;
        const hasWriteAccess = list.owner.toString() === userId.toString() ||
            list.collaborators.some(collaborator => collaborator.toString() === userId.toString());

        if (!hasWriteAccess) {
            return {
                success: false,
                message: "You don't have permission to update the image for this destination",
            };
        }

        const { url, public_id } = imageData;

        if (!url || !public_id) {
            return {
                success: false,
                message: "Image URL and public_id are required",
            };
        }

        destination.image = { url, public_id };
        await destination.save();

        const updatedDestination = await DestinationModel.findById(destinationId)
            .populate("listId", "title description");

        return {
            success: true,
            data: updatedDestination,
            message: "Image updated successfully!",
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

exports.clearImage = async (destinationId, userId) => {
    try {
        const destination = await DestinationModel.findById(destinationId)
            .populate("listId", "owner collaborators");

        if (!destination) {
            return {
                success: false,
                message: "Destination not found",
            };
        }

        const list = destination.listId;
        const hasWriteAccess = list.owner.toString() === userId.toString() ||
            list.collaborators.some(collaborator => collaborator.toString() === userId.toString());

        if (!hasWriteAccess) {
            return {
                success: false,
                message: "You don't have permission to remove the image from this destination",
            };
        }
        
        destination.image = null;
        await destination.save();

        const updatedDestination = await DestinationModel.findById(destinationId)
            .populate("listId", "title description");

        return {
            success: true,
            data: updatedDestination,
            message: "Image cleared successfully!",
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
