const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../data/Signup');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to authenticate access tokens
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Social login
router.post('/social-login', async (req, res) => {
  try {
    const { provider, accessToken, email: manualEmail } = req.body;

    if (!provider || !accessToken) {
      return res.status(400).json({ error: "Provider and access token are required" });
    }

    const validProviders = ["google", "facebook"];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: "Unsupported provider" });
    }

    let userData;
    let dbUserData = {
      Password: "sociallogin",
      ConfirmPassword: "sociallogin",
      CountryCode: 0,
      PhoneNumber: 0,
      userType: "Retailer",
      language: "en",
      provider
    };


    if (provider === "google") {
      // Fetch user info from Google
      const { data } = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      userData = data;
      dbUserData = {
        ...dbUserData,
        social_id: data.sub,
        Email: data.email,
        username: `${data.name}_${provider}_${data.sub.slice(-4)}`,
        avatar: data.picture
      };
    } else if (provider === "facebook") {
      // Fetch user info from Facebook
      const { data } = await axios.get(
        "https://graph.facebook.com/me",
        {
          params: { fields: "id,name,email,picture", access_token: accessToken }
        }
      );

      if (!data.email && !manualEmail) {
        return res.status(400).json({
          error: "Facebook email not found. Please provide manually.",
          needManualEmail: true
        });
      }

      userData = data;
      dbUserData = {
        ...dbUserData,
        social_id: data.id,
        Email: data.email || manualEmail,
        username: `${data.name}_${provider}_${data.id.slice(-4)}`,
        avatar: data.picture?.data?.url || ""
      };
    }

    // Save or update user in DB
    let user = await User.findOne({ Email: dbUserData.Email });
    if (!user) {
      user = new User(dbUserData);
      await user.save();
    } else {
      let updated = false;
      if (!user.social_id && dbUserData.social_id) { user.social_id = dbUserData.social_id; updated = true; }
      if (!user.provider && dbUserData.provider) { user.provider = dbUserData.provider; updated = true; }
      if (!user.username && dbUserData.username) { user.username = dbUserData.username; updated = true; }

      if (user.userType !== "Retailer" && user.userType !== "Supplier") {
        user.userType = "Retailer";
        updated = true;
      }
      if (updated) await user.save();
    }


    // Generate JWT
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      user: {
        ...user.toObject(),
        provider: dbUserData.provider || user.provider,
        social_id: dbUserData.social_id || user.social_id || null,
        username: dbUserData.username || user.username
      },
      token
    });

  } catch (error) {
    console.error("Social login error:", error.response?.data || error.message);
    return res.status(500).json({ error: "Social login failed" });
  }
});

module.exports = router;
