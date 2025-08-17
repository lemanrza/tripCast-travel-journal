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
    searchDestinationsController
} = require("../controllers/destinationController");
const authenticateToken = require("../middleware/authenticateToken");

const destinationRouter = express.Router();

destinationRouter.use(authenticateToken);

destinationRouter.get("/", getAllDestinations);
destinationRouter.post("/", createDestination);
destinationRouter.get("/search", searchDestinationsController);
destinationRouter.get("/my-destinations", getUserOwnDestinations);
destinationRouter.get("/list/:listId", getDestinationsByListId);
destinationRouter.get("/:id", getDestinationById);
destinationRouter.put("/:id", updateDestination);
destinationRouter.delete("/:id", deleteDestination);

// Status management
destinationRouter.patch("/:id/status", updateDestinationStatus);

module.exports = destinationRouter;
