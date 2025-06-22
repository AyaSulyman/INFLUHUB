   const mongoose = require('mongoose');
   require('dotenv').config(); 
   const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/de-vision'; 

   mongoose.connect(uri, {
       useNewUrlParser: true,
       useUnifiedTopology: true
   }).then(() => {
       console.log("Connected to MongoDB");
   }).catch((error) => {
       console.error("MongoDB connection error:", error);
   });
   