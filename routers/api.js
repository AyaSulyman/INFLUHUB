const express = require('express');
const router = express.Router();
const Message = require('../data/data');
const SignupUser  = require('../data/Signup'); 
const jwt = require('jsonwebtoken');
const User = require('../data/Signup');
const bcryptjs = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Middleware to authenticate access tokens
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.sendStatus(401);
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
};

/**
 * @swagger
 * /signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Email
 *               - Password
 *               - ConfirmPassword
 *             properties:
 *               Email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               Password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               ConfirmPassword:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       201:
 *         description: User registered successfully, OTP sent to email
 *       400:
 *         description: Invalid input or email already exists
 */
router.post('/signup', async (req, res) => {
    const { Email, Password, ConfirmPassword } = req.body;
    try {
        if (Password !== ConfirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        const existingUser  = await User.findOne({ Email });
        if (existingUser ) {
            return res.status(400).json({ error: 'User  with this email already exists' });
        }

        const username = Email.split('@')[0];
        const user = new User({ Email, username, Password });
        await user.save();

        // Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        // Send OTP email logic here...

        res.status(201).json({ message: 'OTP sent to your email for verification' });
    } catch (error) {
        res.status(400).json({ error: error.message || "Signup failed" });
    }
});

/**
 * @swagger
 * /verify-otp:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Verify OTP for account activation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Email
 *               - otp
 *             properties:
 *               Email:
 *                 type: string
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: '123456'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/verify-otp', async (req, res) => {
    const { Email, otp } = req.body;
    // OTP verification logic here...
});

/**
 * @swagger
 * /login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: User login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - Password
 *             properties:
 *               username:
 *                 type: string
 *                 example: user123
 *               Password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       404:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/login', async (req, res) => {
    const { username, Password } = req.body;
    // Login logic here...
});

/**
 * @swagger
 * /message:
 *   post:
 *     tags:
 *       - Messages
 *     summary: Create a new message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 example: Hello, this is a message.
 *     responses:
 *       200:
 *         description: Message created successfully
 *       400:
 *         description: Bad request
 */
router.post('/message', (req, res) => {
    const message = new Message(req.body);
    message.save()
        .then((message) => res.status(200).send(message))
        .catch((error) => res.status(400).send(error));
});

/**
 * @swagger
 * /message:
 *   get:
 *     tags:
 *       - Messages
 *     summary: Get all messages
 *     responses:
 *       200:
 *         description: List of all messages
 *       400:
 *         description: Bad request
 */
router.get('/message', (req, res) => {
    Message.find({})
        .then((messages) => res.status(200).send(messages))
        .catch((error) => res.status(400).send(error));
});

/**
 * @swagger
 * /profile-onboarding-submit:
 *   post:
 *     tags:
 *       - Profile
 *     summary: Submit user profile onboarding data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - userType
 *               - CountryCode
 *               - PhoneNumber
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               userType:
 *                 type: string
 *                 enum: [Retailer, Supplier]
 *               CountryCode:
 *                 type: string
 *                 example: '+1'
 *               PhoneNumber:
 *                 type: string
 *                 example: '1234567890'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: All required fields must be filled
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.post('/profile-onboarding-submit', async (req, res) => {
    
});

// Additional routes can be added here following the same pattern

module.exports = router;
