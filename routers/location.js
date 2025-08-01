const express = require('express');
const router = express.Router();
const Address = require('../data/address'); 
const jwt = require('jsonwebtoken');
const User = require('../data/Signup'); 

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to authenticate access tokens
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.sendStatus(401);
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

// Add new address route
router.post('/addresses', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id; 
        const { nickname, street, building, apartment, phone_number, latitude, longitude } = req.body;

        const errors = {};
        if (!nickname) errors.nickname = ["Nickname is required."];
        if (!street) errors.street = ["Street is required."];
        if (!phone_number) errors.phone_number = ["Phone number is required."];
        if (!latitude) errors.latitude = ["Latitude is required."];
        if (!longitude) errors.longitude = ["Longitude is required."];

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: errors
            });
        }

        const existingAddress = await Address.findOne({ user_id: userId, nickname, street, phone_number });
        if (existingAddress) {
            return res.status(400).json({
                success: false,
                message: "An address with the same nickname, street, and phone number already exists."
            });
        }

        const newAddress = new Address({
            user_id: userId,
            nickname,
            street,
            building,
            apartment,
            phone_number,
            latitude,
            longitude
        });

        await newAddress.save(); 

        return res.status(201).json({
            success: true,
            message: "Address added successfully.",
            data: newAddress
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "An error occurred while adding the address."
        });
    }
});

module.exports = router;
