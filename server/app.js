const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const app = express()
const path=require("path")
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
app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "src/views/index.html"));
});

module.exports = app