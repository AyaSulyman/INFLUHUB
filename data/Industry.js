const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    Image: String,
    Username: String,
    Email: String,
    PhoneNumber: String
});

const industrySchema = new mongoose.Schema({
    industry: { type: String, required: true },
    type: { type: [String], required: true },
    Suppliers: [supplierSchema]
});

const Industry = mongoose.model('Industry', industrySchema);
module.exports = Industry;
