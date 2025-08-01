const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User '
    },
    nickname: {
        type: String,
        required: true,
        trim: true
    },
    street: {
        type: String,
        required: true,
        trim: true
    },
    building: {
        type: String,
        trim: true,
        default: null 
    },
    apartment: {
        type: String,
        trim: true,
        default: null 
    },
    phone_number: {
        type: String,
        required: true,
        trim: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    }
}, {
    timestamps: true 
});

const Address = mongoose.model('Address', AddressSchema);
module.exports = Address;
