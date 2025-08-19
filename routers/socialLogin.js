const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const User = require('../data/Signup');

//jwt secret
const JWT_SECRET = process.env.JWT_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Social login
router.post('/social-login', async (req, res) => {
  try {
    const { provider, accessToken, email: manualEmail } = req.body;

    if (!provider || !accessToken) {
      return res.status(400).json({ error: "Provider and access token are required" });
    }

    if (!JWT_SECRET) {
      return res.status(500).json({ error: "Server misconfigured: missing JWT_SECRET" });
    }

    const validProviders = ["google", "facebook"];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ error: "Unsupported provider" });
    }

    let dbUserData = {
      Password: "Social@1234",
      ConfirmPassword: "Social@1234",
      CountryCode: 0,
      PhoneNumber: 0,
      userType: "Retailer",
      language: "en",
      provider,
      Industry: "N/A",
      Degree: "N/A",
      isFreelancer: "No",
      Type: null,
      Capital: null,
      DigitalPresence: null,
      image: "https://dummyimage.com/200x200/cccccc/000000&text=User"
    };

    let socialData;

    if (provider === "google") {

      const ticket = await googleClient.verifyIdToken({
        idToken: accessToken,
        audience: GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      socialData = payload;

      dbUserData = {
        ...dbUserData,
        social_id: payload.sub,
        Email: payload.email,
        username: `${payload.name.replace(/\s+/g, "_")}_${provider}_${payload.sub.slice(-4)}`,
        image: payload.picture || dbUserData.image
      };

    } else if (provider === "facebook") {
      const { data } = await axios.get("https://graph.facebook.com/me", {
        params: { fields: "id,name,email,picture", access_token: accessToken }
      });

      socialData = data;

      const finalEmail = data.email || manualEmail || `${data.id}@facebook.com`;
      dbUserData = {
        ...dbUserData,
        social_id: data.id,
        Email: finalEmail,
        username: `${data.name.replace(/\s+/g, "_")}_${provider}_${data.id.slice(-4)}`,
        image: data.picture?.data?.url || dbUserData.image
      };
    }

    console.log("dbUserData before save/update:", dbUserData);

    let user = await User.findOne({ Email: dbUserData.Email });
    if (!user) {
      try {
        user = new User(dbUserData);
        await user.save();
      } catch (err) {
        if (err.code === 11000) {
          return res.status(409).json({ error: "Account already exists with this email or username" });
        }
        throw err;
      }
    } else {
      let updated = false;

      if (!user.social_id && dbUserData.social_id) { user.social_id = dbUserData.social_id; updated = true; }
      if (!user.provider && dbUserData.provider) { user.provider = dbUserData.provider; updated = true; }
      if (!user.username && dbUserData.username) { user.username = dbUserData.username; updated = true; }
      if (user.userType !== "Retailer" && user.userType !== "Supplier") {
        user.userType = "Retailer"; updated = true;
      }

      if (updated) await user.save();
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      user: {
        ...user.toObject(),
        provider: user.provider,
        social_id: user.social_id || null,
        username: user.username
      },
      token
    });

  } catch (error) {
    console.error("Social login error:", error);
    return res.status(500).json({ error: error.message || "Social login failed" });
  }
});

module.exports = router;
