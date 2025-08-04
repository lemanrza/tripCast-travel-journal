import mongoose from "mongoose";
import travelListSchema from "../schemas/travelListSchema";

const TravelListModel = mongoose.model("TravelList", travelListSchema);

export default TravelListModel;
