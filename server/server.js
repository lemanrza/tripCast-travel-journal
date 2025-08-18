// server.js
const { server } = require("./app");
const connectToDb = require("./src/config/db");

connectToDb(server);
