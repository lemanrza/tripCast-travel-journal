const mongoose = require("mongoose");
const destinationSchema = require("../schemas/destinationSchema.js");

const DestinationModel = mongoose.model("Destination", destinationSchema);

module.exports = DestinationModel;
