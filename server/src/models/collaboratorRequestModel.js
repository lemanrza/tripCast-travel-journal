const mongoose = require("mongoose");
const collaboratorRequestSchema = require("../schemas/collaboratorRequestSchema");

const CollaboratorRequestModel = mongoose.model("CollaboratorRequest", collaboratorRequestSchema);
module.exports = CollaboratorRequestModel;
