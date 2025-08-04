import mongoose from "mongoose";
import destinationSchema from "../schemas/destinationSchema";

const DestinationModel = mongoose.model("Destination", destinationSchema);

export default DestinationModel;
