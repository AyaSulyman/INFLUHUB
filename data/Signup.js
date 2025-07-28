const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');
const multer = require("multer");
const express = require("express");
const router = express.Router();

// User Schema
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
            if (validator.isEmpty(val)) {
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
            let password = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*_])");
            if (!password.test(value)) {
                throw new Error("Password must include uppercase, lowercase, number, and special characters");
            }
        }
    },
    ConfirmPassword: {
        type: String,
        required: true,
        trim: true,
        minlength: 8,
        validate(val) {
            if (val.length < 8) {
                throw new Error("Password must be greater than 8");
            }
        }
    },
    CountryCode: {
        type: Number,
        required: true,
        trim: true,
    },
    PhoneNumber: {
        type: Number,
        required: true,
        trim: true,
    },
    userType: {
        type: String,
        required: true
    },
    Industry: {
        type: String,
        required: function () {
            return this.userType === "Supplier" || this.userType === "Retailer";
        }
    },
    Degree: {
        type: String,
        required: function () {
            return this.userType === "Retailer";
        }
    },
    Type: {
        type: String,
        required: function () {
            return this.userType === "Supplier";
        }
    },
    Capital: {
        type: String,
        required: function () {
            return this.userType === "Supplier";
        }
    },
    DigitalPresence: {
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

// Password hashing middleware
UserSchema.pre("save", async function (next) {
    const user = this;
    if (user.isModified('Password')) {
        user.Password = await bcryptjs.hash(user.Password, 10);
    }
    next();
});

// User model
const User = mongoose.model("User ", UserSchema);

// Multer configuration
const storage = multer.memoryStorage(); 
const upload = multer({ storage });

// Profile onboarding route
router.post(
  "/profile-onboarding-submit",
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        email,
        username: requestedUsername,
        CountryCode,
        PhoneNumber,
        userType,
        Industry,
        Degree,
        isFreelancer,
        Type,
        Capital,
        DigitalPresence,
      } = req.body;

      if (!email || !CountryCode || !PhoneNumber || !userType) {
        return res.status(400).json({ error: "All required fields must be filled." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Image file is required." });
      }

      // Convert image to base64
      const mimeType = req.file.mimetype;
      const base64Image = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;

      const user = await User.findOne({ Email: email });
      if (!user) return res.status(404).json({ error: "User  not found" });

      const username = requestedUsername || email.split("@")[0];

      user.username = username;
      user.CountryCode = CountryCode;
      user.PhoneNumber = PhoneNumber;
      user.userType = userType;
      user.image = base64Image; // Save the base64 image

      // Handle userType specific fields
      if (userType === "Retailer") {
        if (!Industry || !Degree || typeof isFreelancer === "undefined") {
          return res.status(400).json({ message: "All Retailer fields are required" });
        }
        user.Industry = Industry;
        user.Degree = Degree;
        user.isFreelancer = isFreelancer;
      } else if (userType === "Supplier") {
        if (!Industry || !Type || !Capital || typeof DigitalPresence === "undefined") {
          return res.status(400).json({ message: "All Supplier fields are required" });
        }
        user.Industry = Industry;
        user.Type = Type;
        user.Capital = Capital;
        user.DigitalPresence = DigitalPresence;
      } else {
        return res.status(400).json({ message: "Invalid userType" });
      }

      await user.save();
      res.status(200).json({ message: "Profile updated", data: user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
