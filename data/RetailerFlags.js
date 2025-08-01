const mongoose = require('mongoose');

const retailerFlagSchema = new mongoose.Schema({
    carousel: [
        {
            FEATURED: [
                {
                    title: String,
                    id: String,
                    image: String,
                    username: String
                }
            ],
            "HOT PICKS": [
                {
                    title: String,
                    id: String,
                    image: String,
                    username: String
                }
            ],
            "LAST CHANCE": [
                {
                    title: String,
                    id: String,
                    image: String,
                    username: String
                }
            ],
            COMPETITORS: [
                {
                    title: String,
                    id: String,
                    image: String,
                    username: String
                }
            ]
        }
    ]
});

const RetailerFlags = mongoose.model('RetailerFlags', retailerFlagSchema);
module.exports = RetailerFlags;
