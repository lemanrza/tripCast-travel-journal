const {
    getAll,
    getOne,
    getByListId,
    getUserDestinations,
    create,
    update,
    delete: deleteDestination,
    updateStatus,
    addImage,
    removeImage,
} = require("../services/destinationService.js");
const formatMongoData = require("../utils/formatMongoData.js");

exports.getAllDestinations = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const destinations = await getAll(userId);

        res.status(200).json({
            message: "Destinations retrieved successfully!",
            data: formatMongoData(destinations),
        });
    } catch (error) {
        next(error);
    }
};

exports.getDestinationById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const destination = await getOne(id, userId);

        if (!destination) {
            res.status(404).json({
                message: "Destination not found!",
                data: null,
            });
        } else {
            res.status(200).json({
                message: "Destination retrieved successfully!",
                data: formatMongoData(destination),
            });
        }
    } catch (error) {
        if (error.message === "Destination not found" || error.message === "You don't have access to this destination") {
            res.status(404).json({
                message: error.message,
                data: null,
            });
        } else {
            next(error);
        }
    }
};

exports.getDestinationsByListId = async (req, res, next) => {
    try {
        const { listId } = req.params;
        const userId = req.user._id;

        const destinations = await getByListId(listId, userId);

        res.status(200).json({
            message: "Destinations retrieved successfully!",
            data: formatMongoData(destinations),
        });
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

exports.getUserOwnDestinations = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const destinations = await getUserDestinations(userId);

        res.status(200).json({
            message: "User's destinations retrieved successfully!",
            data: formatMongoData(destinations),
        });
    } catch (error) {
        next(error);
    }
};

exports.createDestination = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { name, country, datePlanned, dateVisited, status, notes, image, listId } = req.body;

        console.log("Creating destination with data:", req.body);
        console.log("Image data received:", image);

        const destinationData = {
            name,
            country,
            datePlanned,
            dateVisited,
            status,
            notes,
            image,
            listId,
        };

        const response = await create(destinationData, userId);

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

exports.updateDestination = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const { name, country, datePlanned, dateVisited, status, notes, image } = req.body;

        const updateData = {
            name,
            country,
            datePlanned,
            dateVisited,
            status,
            notes,
            image,
        };

        const response = await update(id, updateData, userId);

        if (!response.success) {
            const statusCode = response.message === "Destination not found" ? 404 : 403;
            return res.status(statusCode).json({
                message: response.message,
                data: null,
            });
        }

        res.status(200).json({
            success: true,
            message: response.message,
            data: formatMongoData(response.data),
        });

    } catch (error) {
        next(error);
    }
};

exports.deleteDestination = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const response = await deleteDestination(id, userId);

        if (!response.success) {
            const statusCode = response.message === "Destination not found" ? 404 : 403;
            return res.status(statusCode).json({
                message: response.message,
                data: null,
            });
        }

        res.status(200).json({
            success: true,
            message: response.message,
            data: null,
        });
    } catch (error) {
        next(error);
    }
};

exports.updateDestinationStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user._id;

        if (!status) {
            return res.status(400).json({
                message: "Status is required",
                data: null,
            });
        }

        const response = await updateStatus(id, status, userId);

        if (!response.success) {
            const statusCode = response.message === "Destination not found" ? 404 :
                response.message.includes("Invalid status") ? 400 : 403;

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

exports.addImageToDestination = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { url, public_id } = req.body;
        const userId = req.user._id;

        if (!url || !public_id) {
            return res.status(400).json({
                message: "Image URL and public_id are required",
                data: null,
            });
        }

        const imageData = { url, public_id };
        const response = await addImage(id, imageData, userId);

        if (!response.success) {
            const statusCode = response.message === "Destination not found" ? 404 : 403;
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

exports.removeImageFromDestination = async (req, res, next) => {
    try {
        const { id, imageId } = req.params;
        const userId = req.user._id;

        const response = await removeImage(id, imageId, userId);

        if (!response.success) {
            const statusCode = response.message === "Destination not found" ? 404 : 403;
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
