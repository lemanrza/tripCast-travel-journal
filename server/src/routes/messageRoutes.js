const { Router } = require("express");
const { httpList, httpSendMessage } = require("../controllers/messageController");
const requireAuth = require("../middleware/requireAuth");


const messageRouter = Router();
messageRouter.use(requireAuth); 
messageRouter.get("/groups/:groupId/messages", httpList);
messageRouter.post("/groups/:groupId/messages", httpSendMessage);

module.exports = messageRouter;
