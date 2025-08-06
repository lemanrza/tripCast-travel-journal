const express = require("express");
const {
    getAllLists,
    getListById,
    createList,
    deleteList,
    updateList,
    getUserOwnLists,
    getUserCollaborativeLists,
    addCollaboratorToList,
    removeCollaboratorFromList,
    addDestinationToList,
    removeDestinationFromList
} = require("../controllers/listController");
const authenticateToken = require("../middleware/authenticateToken");

const listRouter = express.Router();

// Apply authentication middleware to all routes
listRouter.use(authenticateToken);

// Main CRUD routes
listRouter.get("/", getAllLists);
listRouter.post("/", createList);
listRouter.get("/my-lists", getUserOwnLists);
listRouter.get("/collaborative", getUserCollaborativeLists);
listRouter.get("/:id", getListById);
listRouter.put("/:id", updateList);
listRouter.delete("/:id", deleteList);

// Collaboration routes
listRouter.post("/:id/collaborators", addCollaboratorToList);
listRouter.delete("/:id/collaborators/:collaboratorId", removeCollaboratorFromList);

// Destination routes
listRouter.post("/:id/destinations", addDestinationToList);
listRouter.delete("/:id/destinations/:destinationId", removeDestinationFromList);

module.exports = listRouter;
