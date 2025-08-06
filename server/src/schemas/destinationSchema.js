const mongoose = require('mongoose');

const destinationSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true },
        datePlanned: { type: Date, required: true },
        dateVisited: { type: Date, default: null },
        status: {
            type: String,
            enum: ['wishlist', 'planned', 'completed', 'cancelled'],
            default: 'wishlist',
            required: true
        },
        notes: { type: String, trim: true, default: '' },
        images:
            [
            {
                    url: { type: String, required: true },
                    public_id: { type: String, required: true },
                },
            ],
        listId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TravelList',
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = destinationSchema;