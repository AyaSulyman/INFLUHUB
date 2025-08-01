const mongoose = require('mongoose');

const capitalSchema = new mongoose.Schema({
    Capital: { type: [String], required: true }
});

const Capital = mongoose.model('Capital', capitalSchema);
module.exports = Capital;
