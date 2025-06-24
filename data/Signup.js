const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
        trim: true,
        unique: true
    },
    Email: {
        type: String,
        require: true,
        trim: true,
        lowercase: true,
        unique: true,
        validate(val) {
            if (validator.isEmpty(val)) {
                throw new Error("email is invalid");
            }
        }
    },
    Password: {
        type: String,
        require: true,
        trim: true,
        minlength: 8,
        validate(val) {
           
            if (val.length < 8) { 
                throw new Error("password must be greater than 8");
            }
        }
    },
    ConfirmPassword: {
        type: String,
        require: true,
        trim: true,
        minlength: 8,
        validate(val) {
     
            if (val.length < 8) { 
                throw new Error("password must be greater than 8");
            }
        }
    }
}, {
    timestamps: true 
});


UserSchema.pre("save", async function (next) { 
    const user = this;
  
    if (user.isModified('Password')) {
        user.Password = await bcryptjs.hash(user.Password, 10);
    }
    next(); 
});

const User = mongoose.model("User ", UserSchema);
module.exports = User;
