const mongoose = require('mongoose');

const supplierFlagSchema = new mongoose.Schema({
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
            "LOW IN STOCK": [
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

const SupplierFlags = mongoose.model('SupplierFlags', supplierFlagSchema);
module.exports = SupplierFlags;
