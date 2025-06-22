const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    code: {
        type: String, 
        enum: ['200', '0*0000'], 
        default: '200'
    },
    description: {
        type: String,
        default: 'Hello Aya'
    },
    
    
});

const Message = mongoose.model("Message", MessageSchema);
module.exports = Message;
