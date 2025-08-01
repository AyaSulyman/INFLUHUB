const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        validate(val) {
            if (!validator.isEmail(val)) {
                throw new Error("Email is invalid");
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 8,
        validate(value) {
            const passwordRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*_])");
            if (!passwordRegex.test(value)) {
                throw new Error("Password must include uppercase, lowercase, number, and special characters");
            }
        }
    },
    countryCode: {
        type: Number,
        required: true,
        trim: true,
    },
    phoneNumber: {
        type: Number,
        required: true,
        trim: true,
    },
    userType: {
        type: String,
        required: true
    },
    industry: {
        type: String,
        required: function () {
            return this.userType === "Supplier" || this.userType === "Retailer";
        }
    },
    degree: {
        type: String,
        required: function () {
            return this.userType === "Retailer";
        }
    },
    type: {
        type: String,
        required: function () {
            return this.userType === "Supplier";
        }
    },
    capital: {
        type: String,
        required: function () {
            return this.userType === "Supplier";
        }
    },
    digitalPresence: {
        type: String,
        required: function () {
            return this.userType === 'Supplier';
        }
    },
    isFreelancer: {
        type: String,
        required: function () {
            return this.userType === 'Retailer';
        }
    },
    image: {
        type: String,
        required: function () {
            return this.userType === "Supplier" || this.userType === "Retailer";
        }
    }
}, {
    timestamps: true
});


UserSchema.pre("save", async function (next) {
    const user = this;

    if (user.isModified('password')) {
        user.password = await bcryptjs.hash(user.password, 10);
    }
    next();
});


   UserSchema.methods.comparePassword = async function(candidatePassword) {
       return await bcryptjs.compare(candidatePassword, this.password);
   };
   


UserSchema.statics.findByCredentials = async function (email, password) {
    const user = await this.findOne({ email });
    if (!user) {
        throw new Error("Unable to login");
    }
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Unable to login");
    }
    return user;
};

const User = mongoose.model("User ", UserSchema);
module.exports = User;
