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
        validate(value) {
            let password = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*_])")
            if (!password.test(value)) {
                throw new Error("password must included uppercase,lowercase,number ,and special characters")
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
    },

    CountryCode: {
        type: Number,
        require: true,
        trim: true,

    },
    PhoneNumber: {
        type: Number,
        require: true,
        trim: true,


    },
    userType: {
        type: String,
        require: true
    },
 
    Industry: {
        type: String,
        require: function () {
            return this.userType === "Supplier" || this.userType === "Retailer"
        }
    },
    Degree: {
        type: String,
        require: function () {
            return this.userType === "Retailer"
        }
    },

    Type: {
        type: String,
        require: function () {
            return this.userType === "Supplier"
        }
    },

    Capital: {
        type: String,
        require: function () {
            return this.userType === "Supplier"
        }
    },
    DigitalPresence: {
        type: String,
        require: function () {
            return this.userType === 'Supplier';
        }
    },
    isFreelancer: {
        type: String,
        require: function () {
            return this.userType === 'Retailer';
        }
    },
    image: {
        type: String, 
         require: function () {
            return this.userType === "Supplier" || this.userType === "Retailer"
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

UserSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcryptjs.compare(candidatePassword, this.Password); 
};

UserSchema.statics.findByCredentials = async function (email, password) {
    const user = await this.findOne({ email });
    if (!user) {
        throw new Error("Unable to login");
    }
    const isMatch = await bcryptjs.compare(password, user.Password);
    if (!isMatch) {
        throw new Error("Unable to login");
    }
    return user;
};

const User = mongoose.model("User ", UserSchema);
module.exports = User;
