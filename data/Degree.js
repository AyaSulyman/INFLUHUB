const mongoose = require('mongoose');

const degreeSchema = new mongoose.Schema({
    Degrees: {
        type: [String], 
        required: true
    }
});

const Degree = mongoose.model('Degree', degreeSchema);
module.exports = Degree;
