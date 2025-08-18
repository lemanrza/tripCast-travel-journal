const mongoose = require("mongoose");
const groupSchema = require("../schemas/groupSchema");

const GroupModel = mongoose.model("Group", groupSchema);

module.exports = GroupModel;
