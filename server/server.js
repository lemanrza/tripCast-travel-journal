const app = require("./app")
const connectToDb=require("./src/config/db")

connectToDb(app)