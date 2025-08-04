const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    Image: {
        type: String,
        required: true
    },
    Username: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    PhoneNumber: {
        type: String,
        required: true
    }
});

const industrySchema = new mongoose.Schema({
    industry: {
        type: String,
        required: true
    },
    type: {
        type: [String],
        required: true
    },
    Suppliers: {
        type: [supplierSchema],
        required: true
    }
});

module.exports = mongoose.model('Industry', industrySchema);
