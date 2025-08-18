// src/config/db.js
const { PORT, DB_URL, DB_PASSWORD } = require("./config");
const mongoose = require("mongoose");

const connectToDB = (server) => {
  mongoose
    .connect(DB_URL.replace("<db_password>", DB_PASSWORD))
    .then(() => {
      console.log("Mongo DB connected");
      server.listen(PORT, () => {
        console.log(`HTTP+WS running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => console.warn("DB connection failed", err.message));
};

module.exports = connectToDB;
