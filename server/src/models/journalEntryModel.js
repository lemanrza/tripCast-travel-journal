const mongoose = require("mongoose");
const journalEntrySchema = require("../schemas/journalEntry");

const JournalEntryModel = mongoose.model("JournalEntry", journalEntrySchema);

module.exports = JournalEntryModel;
