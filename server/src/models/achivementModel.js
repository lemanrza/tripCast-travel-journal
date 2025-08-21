const mongoose=require("mongoose");
const achievementSchema = require("../schemas/achivementsSchema");

const AchievementModel = mongoose.model("Achievement", achievementSchema);

module.exports = AchievementModel;