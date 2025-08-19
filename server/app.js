// app.js
const { CLIENT_URL, JWT_SECRET_SOCKET, JWT_ACCESS_SECRET_KEY } = require("./src/config/config.js");
const http = require("http");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const path = require("path");

require("./src/models/userModel.js");
require("./src/models/journalEntryModel.js");
require("./src/models/travelListModel.js");
require("./src/models/destinationModel.js");
require("./src/models/commentModel.js");
require("./src/models/groupModel.js");

const errorHandler = require("./src/middleware/errorHandler.js");
const userRouter = require("./src/routes/userRoute.js");
const listRouter = require("./src/routes/listRoute.js");
const destinationRouter = require("./src/routes/destinationRoute.js");
const journalRouter = require("./src/routes/journalRoute.js");
const googleRouter = require("./src/routes/googleRoute.js");
const uploadRouter = require("./src/routes/uploadRoute.js");
const groupRouter = require("./src/routes/groupRoute.js")

const socketAuth = require("./src/middleware/realtime/auth.js");
const registerGroupHandlers = require("./src/middleware/realtime/groups.js");
const messageRouter = require("./src/routes/messageRoutes.js");

require("./src/config/passport");

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cors({ origin: [CLIENT_URL || "http://localhost:5173"], credentials: true }));
app.use(cookieParser());
app.use(helmet());
app.use(passport.initialize());

// routes
app.use("/auth", userRouter);
app.use("/auth", googleRouter);
app.use("/lists", listRouter);
app.use("/destinations", destinationRouter);
app.use("/journals", journalRouter);
app.use("/upload", uploadRouter);
app.use("/messages", messageRouter);
app.use("/groups", groupRouter)

// error handler
app.use(errorHandler);

// health + demo
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "src/views/index.html"));
});
app.get("/healthz", (_, res) => res.send("ok"));

// Socket.IO on the SAME server we will start
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: [CLIENT_URL || "http://localhost:5173"], credentials: true },
  path: "/realtime",
  pingInterval: 25000,
  pingTimeout: 60000,
});
app.set("io", io);

io.use(socketAuth(JWT_ACCESS_SECRET_KEY));
io.on("connection", (socket) => {
  console.log("[ws] connected", socket.id);
  registerGroupHandlers(io, socket);
});

// export BOTH app and server
module.exports = { app, server, io };
