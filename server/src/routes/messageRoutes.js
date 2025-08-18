const { Router } = require("express");
const { httpList, httpSendMessage } = require("../controllers/messageController");

const requireAuth = (req, res, next) => next();

const messageRouter = Router();
messageRouter.get("/groups/:groupId/messages", requireAuth, httpList);
messageRouter.post("/groups/:groupId/messages", requireAuth, httpSendMessage);  

module.exports = messageRouter;
