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

// Social login route
router.post('/social-login', async (req, res) => {
    try {
        const { provider, access_token, email: manualEmail } = req.body;

        if (!provider || !access_token) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const validProviders = ['google', 'facebook', 'instagram'];
        if (!validProviders.includes(provider)) {
            return res.status(400).json({ error: "Provider is not supported" });
        }

        let userData;

        if (provider === 'google') {
            const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            const data = response.data;
            userData = {
                providerId: data.sub,
                email: data.email,
                name: data.name,
                avatar: data.picture,
                provider: 'google'
            };
        } else if (provider === 'facebook') {
            const response = await axios.get(`https://graph.facebook.com/me?fields=id,name,email&access_token=${access_token}`);
            const data = response.data;
            userData = {
                providerId: data.id,
                email: data.email,
                name: data.name,
                avatar: '',
                provider: 'facebook'
            };
        } else if (provider === 'instagram') {
            const response = await axios.get(`https://graph.instagram.com/me?fields=id,username,account_type&access_token=${access_token}`);
            const data = response.data;
            if (!manualEmail) {
                return res.status(400).json({ error: "Instagram does not provide email. Please provide one." });
            }
            userData = {
                providerId: data.id,
                email: manualEmail,
                name: data.username,
                avatar: '',
                provider: 'instagram'
            };
        }

        if (!userData || !userData.email) {
            return res.status(400).json({ error: "Failed to retrieve user email." });
        }

        let user = await User.findOne({ Email: userData.email });

        if (!user) {
            user = new User({
                username: userData.name,
                Email: userData.email,
                avatar: userData.avatar,
                provider: userData.provider,
                providerId: userData.providerId,
                Password: 'sociallogin',
                ConfirmPassword: 'sociallogin',
                CountryCode: 0,
                PhoneNumber: 0,
                userType: 'social',
                language: 'en'
            });

            await user.save();
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.Email,
                avatar: user.avatar
            }
        });

    } catch (error) {
        console.error("Social login error:", error.response?.data || error.message);
        return res.status(500).json({ error: "Social login failed" });
    }
});

module.exports = router;
