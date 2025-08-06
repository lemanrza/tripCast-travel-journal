const express = require("express");
const {
    getAllDestinations,
    getDestinationById,
    getDestinationsByListId,
    getUserOwnDestinations,
    createDestination,
    updateDestination,
    deleteDestination,
    updateDestinationStatus,
    addImageToDestination,
    removeImageFromDestination,
} = require("../controllers/destinationController");
const authenticateToken = require("../middleware/authenticateToken");

const destinationRouter = express.Router();

// Apply authentication middleware to all routes
destinationRouter.use(authenticateToken);

// Main CRUD routes
destinationRouter.get("/", getAllDestinations);
destinationRouter.post("/", createDestination);
destinationRouter.get("/my-destinations", getUserOwnDestinations);
destinationRouter.get("/list/:listId", getDestinationsByListId);
destinationRouter.get("/:id", getDestinationById);
destinationRouter.put("/:id", updateDestination);
destinationRouter.delete("/:id", deleteDestination);

// Status management
destinationRouter.patch("/:id/status", updateDestinationStatus);

// Image management
destinationRouter.post("/:id/images", addImageToDestination);
destinationRouter.delete("/:id/images/:imageId", removeImageFromDestination);

module.exports = destinationRouter;
