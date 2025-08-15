const {
    getAll,
    getOne,
    getUserLists,
    getCollaborativeLists,
    create,
    update,
    delete: deleteList,
    addDestination,
    removeDestination,
    addCollaborator,
    getMyCollaboratorRequests,
    acceptCollaboratorRequest,
    rejectCollaboratorRequest,
    removeCollaborator,
} = require("../services/listService.js");
const UserModel = require("../models/userModel.js");
const config = require("../config/config.js");
const formatMongoData = require("../utils/formatMongoData.js");
const { sendCollaboratorInviteEmail } = require("../utils/sendMail.js");

exports.getAllLists = async (_, res, next) => {
    try {
        const lists = await getAll();

        res.status(200).json({
            message: "Travel lists retrieved successfully!",
            data: formatMongoData(lists),
        });
    } catch (error) {
        next(error);
    }
};

exports.getListById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const list = await getOne(id);

        if (!list) {
            res.status(404).json({
                message: "Travel list not found!",
                data: null,
            });
        } else {
            res.status(200).json({
                message: "Travel list retrieved successfully!",
                data: formatMongoData(list),
            });
        }
    } catch (error) {
        if (error.message === "Travel list not found" || error.message === "You don't have access to this travel list") {
            res.status(404).json({
                message: error.message,
                data: null,
            });
        } else {
            next(error);
        }
    }
};

exports.getUserOwnLists = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const lists = await getUserLists(userId);

        res.status(200).json({
            message: "User's travel lists retrieved successfully!",
            data: formatMongoData(lists),
        });
    } catch (error) {
        next(error);
    }
};

exports.getUserCollaborativeLists = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const lists = await getCollaborativeLists(userId);

        res.status(200).json({
            message: "Collaborative travel lists retrieved successfully!",
            data: formatMongoData(lists),
        });
    } catch (error) {
        next(error);
    }
};

exports.createList = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { title, description, tags, isPublic, coverImage } = req.body;

        const listData = {
            title,
            description,
            tags,
            isPublic,
            coverImage,
        };

        const response = await create(listData, userId);

        if (!response.success) {
            return res.status(400).json({
                message: response.message,
                data: null,
            });
        }

        res.status(201).json({
            message: response.message,
            data: formatMongoData(response.data),
        });
    } catch (error) {
        next(error);
    }
};

exports.updateList = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { title, description, tags, isPublic, coverImage } = req.body;

        const updateData = {
            title,
            description,
            tags,
            isPublic,
            coverImage,
        };

        const response = await update(id, updateData, userId);

        if (!response.success) {
            const statusCode = response.message === "Travel list not found" ? 404 : 403;
            return res.status(statusCode).json({
                message: response.message,
                data: null,
            });
        }

        res.status(200).json({
            message: response.message,
            data: formatMongoData(response.data),
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteList = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const response = await deleteList(id, userId);

        if (!response.success) {
            const statusCode = response.message === "Travel list not found" ? 404 : 403;
            return res.status(statusCode).json({
                message: response.message,
                data: null,
            });
        }

        res.status(200).json({
            message: response.message,
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

exports.addCollaboratorToList = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { collaboratorEmail } = req.body;
        const userId = req.user._id || req.user.id;

        if (!collaboratorEmail) {
            return res.status(400).json({ message: "Collaborator email is required", data: null });
        }

        const response = await addCollaborator(id, collaboratorEmail, String(userId));

        if (!response.success) {
            const statusCode =
                response.message === "Travel list not found" ||
                    response.message === "User with this email not found" ? 404 :
                    response.message === "Only the owner can add collaborators" ? 403 :
                        response.message === "Invite already sent" ? 409 : 400;

            return res.status(statusCode).json({ message: response.message, data: null });
        }

        try {
            const [inviterDoc, collaboratorDoc] = await Promise.all([
                UserModel.findById(userId).select("fullName email"),
                UserModel.findOne({ email: collaboratorEmail }).select("fullName email"),
            ]);

            const listTitle = response.data?.title || "a travel list";
            const base = (config.CLIENT_URL || config.APP_URL || "").replace(/\/+$/, "");
            const listLink = base ? `${base}/lists/${id}` : undefined;

            await sendCollaboratorInviteEmail({
                toEmail: collaboratorDoc?.email || collaboratorEmail,
                toName: collaboratorDoc?.fullName || collaboratorEmail,
                inviterName: inviterDoc?.fullName || "A TripCast user",
                listTitle,
                listLink,
            });

            console.log("Collaborator invite email queued to:", collaboratorDoc?.email || collaboratorEmail);
        } catch (mailErr) {
            console.error("Collaborator email failed (non-fatal):", mailErr?.message || mailErr);
        }

        return res.status(200).json({
            message: response.message,
            data: formatMongoData(response.data),
        });
    } catch (error) {
        next(error);
    }
};

exports.removeCollaboratorFromList = async (req, res, next) => {
    try {
        const { id, collaboratorId } = req.params;
        const userId = req.user._id || req.user.id;

        const response = await removeCollaborator(id, collaboratorId, String(userId));

        if (!response.success) {
            const statusCode =
                response.message === "Travel list not found" ? 404 :
                    response.message === "Only the owner can remove collaborators" ? 403 :
                        400;

            return res.status(statusCode).json({ message: response.message, data: null });
        }

        res.status(200).json({
            message: response.message,
            data: formatMongoData(response.data),
        });
    } catch (err) {
        next(err);
    }
};


exports.getPendingCollabRequests = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;
        const response = await getMyCollaboratorRequests(String(userId));
        if (!response.success) return res.status(400).json({ message: response.message, data: null });
        res.status(200).json({ message: "OK", data: response.data });
    } catch (e) { next(e); }
};

exports.acceptCollabRequest = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;
        const { requestId } = req.params;
        const response = await acceptCollaboratorRequest(String(userId), String(requestId));
        if (!response.success) {
            const status = /not found/i.test(response.message) ? 404 : 400;
            return res.status(status).json({ message: response.message, data: null });
        }
        res.status(200).json({ message: response.message, data: formatMongoData(response.data) });
    } catch (e) { next(e); }
};

exports.rejectCollabRequest = async (req, res, next) => {
    try {
        const userId = req.user._id || req.user.id;
        const { requestId } = req.params;
        const response = await rejectCollaboratorRequest(String(userId), String(requestId));
        if (!response.success) {
            const status = /not found/i.test(response.message) ? 404 : 400;
            return res.status(status).json({ message: response.message, data: null });
        }
        res.status(200).json({ message: response.message, data: null });
    } catch (e) { next(e); }
};

exports.addDestinationToList = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { destinationId } = req.body;
        const userId = req.user.id;

        if (!destinationId) {
            return res.status(400).json({
                message: "Destination ID is required",
                data: null,
            });
        }

        const response = await addDestination(id, destinationId, userId);

        if (!response.success) {
            const statusCode = response.message === "Travel list not found" ? 404 :
                response.message === "You don't have permission to add destinations to this list" ? 403 : 400;

            return res.status(statusCode).json({
                message: response.message,
                data: null,
            });
        }

        res.status(200).json({
            message: response.message,
            data: formatMongoData(response.data),
        });
    } catch (error) {
        next(error);
    }
};

exports.removeDestinationFromList = async (req, res, next) => {
    try {
        const { id, destinationId } = req.params;
        const userId = req.user.id;

        const response = await removeDestination(id, destinationId, userId);

        if (!response.success) {
            const statusCode = response.message === "Travel list not found" ? 404 :
                response.message === "You don't have permission to remove destinations from this list" ? 403 : 400;

            return res.status(statusCode).json({
                message: response.message,
                data: null,
            });
        }

        res.status(200).json({
            message: response.message,
            data: formatMongoData(response.data),
        });
    } catch (error) {
        next(error);
    }
};
