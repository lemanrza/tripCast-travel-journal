const mongoose = require("mongoose");
const travelListSchema = require("../schemas/travelListSchema.js");

const TravelListModel = mongoose.model("TravelList", travelListSchema);

module.exports = TravelListModel;
