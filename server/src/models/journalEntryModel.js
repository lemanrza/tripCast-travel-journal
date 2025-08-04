import mongoose from "mongoose";
import journalEntrySchema from "../schemas/journalEntry";

const JournalEntryModel = mongoose.model("JournalEntry", journalEntrySchema);

export default JournalEntryModel;
