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
    Email: {
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
    Password: {
        type: String,
        required: true,
        trim: true,
        minlength: 8,
        validate(value) {
            let password = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*_])");
            if (!password.test(value)) {
                throw new Error("Password must include uppercase, lowercase, number, and special characters");
            }
        }
    },
    ConfirmPassword: {
        type: String,
        trim: true,
        minlength: 8,
    },
    CountryCode: {
        type: Number,
        trim: true,
    },
    PhoneNumber: {
        type: Number,
        trim: true,
    },
    userType: {
        type: String,
    },
    Industry: {
        type: String,
        required: function () {
            return this.userType === "Supplier" || this.userType === "Retailer";
        },
        default: null
    },
    Degree: {
        type: String,
        required: function () {
            return this.userType === "Retailer";
        },
        default: null
    },
    Type: {
        type: String,
        required: function () {
            return this.userType === "Supplier";
        },
        default: null
    },
    Capital: {
        type: String,
        required: function () {
            return this.userType === "Supplier";
        },
        default: null
    },
    DigitalPresence: {
        type: String,
        required: function () {
            return this.userType === 'Supplier';
        },
        default: null
    },
    isFreelancer: {
        type: String,
        required: function () {
            return this.userType === 'Retailer';
        },
        default: null
    },
    image: {
        type: String, 
        required: function () {
            return this.userType === "Supplier" || this.userType === "Retailer";
        },
        default: "https://dummyimage.com/200x200/cccccc/000000&text=User"
    },
    language: {
        type: String,
        default: 'en'
    },
    provider: {
        type: String, 
        default: null
    },
    social_id: {
        type: String, 
        default: null
    },
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

UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcryptjs.compare(candidatePassword, this.Password); 
};

UserSchema.statics.findByCredentials = async function (email, password) {
    const user = await this.findOne({ Email: email });
    if (!user) {
        throw new Error("Unable to login");
    }
    const isMatch = await bcryptjs.compare(password, user.Password);
    if (!isMatch) {
        throw new Error("Unable to login");
    }
    return user;
};

const User = mongoose.model("User", UserSchema);
module.exports = User;
