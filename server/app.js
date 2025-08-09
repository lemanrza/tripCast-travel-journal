const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const passport = require("passport")

require("./src/models/userModel.js");
require("./src/models/journalEntryModel.js");
require("./src/models/travelListModel.js");
require("./src/models/destinationModel.js");

const errorHandler = require("./src/middleware/errorHandler.js")
const userRouter = require("./src/routes/userRoute.js")
const listRouter = require("./src/routes/listRoute.js")
const destinationRouter = require("./src/routes/destinationRoute.js")
const googleRouter = require("./src/routes/googleRoute.js");

// Initialize Passport configuration
require("./src/config/passport");

const app = express()
const path = require("path")
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100
})
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"))
app.use(cors())
app.use(limiter)
app.use(helmet())
app.use(passport.initialize())

app.use("/auth", userRouter);
app.use("/auth", googleRouter);
app.use("/lists", listRouter);
app.use("/destinations", destinationRouter);


app.use(errorHandler);


app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "src/views/index.html"));
});

module.exports = app