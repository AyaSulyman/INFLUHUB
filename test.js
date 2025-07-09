require('dotenv').config(); 
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI; 

if (!uri) {
  console.error("MongoDB connection string is not defined. Please check your .env file.");
  process.exit(1); 
}

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    mongoose.connection.close(); 
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
