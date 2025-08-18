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
    removeDestinationFromList,
    getPendingCollabRequests,
    acceptCollabRequest,
    rejectCollabRequest,
    searchListsController,
    httpEnableChat
} = require("../controllers/listController");
const authenticateToken = require("../middleware/authenticateToken");

const listRouter = express.Router();

listRouter.use(authenticateToken);

listRouter.get("/", getAllLists);
listRouter.post("/", createList);
listRouter.get("/search", searchListsController);
listRouter.get("/my-lists", getUserOwnLists);
listRouter.get("/collaborative", getUserCollaborativeLists);
listRouter.get("/:id", getListById);
listRouter.put("/:id", updateList);
listRouter.delete("/:id", deleteList);

// Invite by email
listRouter.post("/:id/invite", addCollaboratorToList);

// Owner removes a collaborator
listRouter.delete("/:id/collaborators/:collaboratorId", removeCollaboratorFromList);

listRouter.get("/me/collab-requests", getPendingCollabRequests);
listRouter.post("/me/collab-requests/:requestId/accept", acceptCollabRequest);
listRouter.post("/me/collab-requests/:requestId/reject", rejectCollabRequest);

listRouter.post("/:id/destinations", addDestinationToList);
listRouter.delete("/:id/destinations/:destinationId", removeDestinationFromList);

//socket
listRouter.post("/:id/enable-chat", httpEnableChat);

module.exports = listRouter;
