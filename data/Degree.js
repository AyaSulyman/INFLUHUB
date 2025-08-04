const mongoose = require('mongoose');

const degreeSchema = new mongoose.Schema({
    Degree: {
        type: [String],
        required: true
    }
});

module.exports = mongoose.model('Degree', degreeSchema);
