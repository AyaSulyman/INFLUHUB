const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
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

// Social login
router.post('/social-login', async (req, res) => {
    try {
        const { provider, access_token, email: manualEmail } = req.body;

        if (!provider || !access_token) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const validProviders = ['google', 'facebook']; 
        if (!validProviders.includes(provider)) {
            return res.status(400).json({ error: "Unsupported provider" });
        }

        let userData;
        let dbUserData = {
            Password: 'sociallogin',
            ConfirmPassword: 'sociallogin',
            CountryCode: 0,
            PhoneNumber: 0,
            userType: 'social',
            language: 'en'
        };

        if (provider === 'google') {
            const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            userData = {
                sub: data.sub,
                name: data.name,
                email: data.email,
                picture: data.picture
            };

            dbUserData = {
                ...dbUserData,
                providerId: data.sub,
                Email: data.email,
                username: data.name,
                avatar: data.picture,
                provider: 'google'
            };
        } else if (provider === 'facebook') {
            const { data } = await axios.get(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${access_token}`);

            if (!data.email && !manualEmail) {
                return res.status(400).json({
                    error: "Facebook email not found. Please provide manually.",
                    needManualEmail: true
                });
            }

            userData = {
                id: data.id,
                name: data.name,
                email: data.email || manualEmail
            };

            dbUserData = {
                ...dbUserData,
                providerId: data.id,
                Email: data.email || manualEmail,
                username: data.name,
                avatar: data.picture?.data?.url || '',
                provider: 'facebook'
            };
        }

        // Save or retrieve user
        if (dbUserData.Email) {
            let user = await User.findOne({ Email: dbUserData.Email });

            if (!user) {
                user = new User(dbUserData);
                await user.save();
            }

            const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
            return res.status(200).json({ user: user, token }); 
        }

    } catch (error) {
        console.error("Social login error:", error.response?.data || error.message);
        return res.status(500).json({ error: "Social login failed" });
    }
});

module.exports = router;
