const mongoose = require('mongoose');
const Capital = require('../data/Capital');
const Degree = require('../data/Degree');
const capitalData = require('../json files/Capitals.json');
const degreeData = require('../json files/Degrees.json');

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        try {
            await Capital.deleteMany({});
            await Capital.insertMany(capitalData);
            console.log("Capitals populated!");

            await Degree.deleteMany({});
            await Degree.insertMany(degreeData);
            console.log("Degrees populated!");
        } catch (err) {
            console.error("Error during data population:", err);
        }
    })
    .catch(err => {
        console.error("Error connecting to MongoDB:", err);
    })
    .finally(() => {
        mongoose.connection.close();
    });
