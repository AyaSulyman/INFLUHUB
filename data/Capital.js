const mongoose = require('mongoose');

const capitalSchema = new mongoose.Schema({
    Capital: {
        type: [String], 
        required: true
    }
});

module.exports = mongoose.model('Capital', capitalSchema);
