const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../data/Signup');

const JWT_SECRET = process.env.JWT_SECRET;


async function saveOrUpdateUser(dbUserData) {
  let user = await User.findOne({ Email: dbUserData.Email });
  if (!user) {
    user = new User(dbUserData);
    await user.save();
  } else {
    let updated = false;
    if (!user.social_id && dbUserData.social_id) { user.social_id = dbUserData.social_id; updated = true; }
    if (!user.provider && dbUserData.provider) { user.provider = dbUserData.provider; updated = true; }
    if (!user.username && dbUserData.username) { user.username = dbUserData.username; updated = true; }
    if (updated) await user.save();
  }
  return user;
}

// Common login logic
async function handleSocialLogin({ provider, code, access_token, manualEmail }) {
  let userData;
  let dbUserData = {
    Password: "sociallogin",
    ConfirmPassword: "sociallogin",
    CountryCode: 0,
    PhoneNumber: 0,
    userType: "social",
    language: "en",
    provider
  };

  if (provider === "google") {
    if (!code) throw new Error("Google code is required");

    const tokenRes = await axios.post(
      `https://oauth2.googleapis.com/token`,
      new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code"
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const googleAccessToken = tokenRes.data.access_token;

    const { data } = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      { headers: { Authorization: `Bearer ${googleAccessToken}` } }
    );

    userData = data;
    dbUserData = {
      ...dbUserData,
      social_id: data.sub,
      Email: data.email,
      username: `${data.name}_${provider}_${data.sub.slice(-4)}`,
      avatar: data.picture
    };
  }

  else if (provider === "facebook") {
    // If we have a code (web flow)
    if (code && !access_token) {
      const tokenRes = await axios.get(
        `https://graph.facebook.com/v18.0/oauth/access_token`,
        {
          params: {
            client_id: process.env.FB_APP_ID,
            client_secret: process.env.FB_APP_SECRET,
            redirect_uri: process.env.FB_REDIRECT_URI,
            code
          }
        }
      );
      access_token = tokenRes.data.access_token;
    }

    if (!access_token) {
      throw new Error("Facebook access token is required");
    }

    const { data } = await axios.get(
      "https://graph.facebook.com/me",
      {
        params: { fields: "id,name,email,picture", access_token }
      }
    );

    if (!data.email && !manualEmail) {
      throw { needManualEmail: true, message: "Facebook email not found. Please provide manually." };
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
  const user = await saveOrUpdateUser(dbUserData);

  // Generate JWT
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "7d" });

  return {
    user: {
      ...user.toObject(),
      provider: dbUserData.provider || user.provider,
      social_id: dbUserData.social_id || user.social_id || null,
      username: dbUserData.username || user.username
    },
    token
  };
}

// POST flow (mobile/Postman)
router.post('/social-login', async (req, res) => {
  try {
    const { provider, code, access_token, email: manualEmail } = req.body;
    const validProviders = ["google", "facebook"];

    if (!provider || !validProviders.includes(provider)) {
      return res.status(400).json({ error: "Unsupported or missing provider" });
    }

    const result = await handleSocialLogin({ provider, code, access_token, manualEmail });
    res.status(200).json(result);

  } catch (error) {
    console.error("Social login error:", error.response?.data || error.message);
    if (error.needManualEmail) {
      return res.status(400).json({ error: error.message, needManualEmail: true });
    }
    res.status(500).json({ error: "Social login failed" });
  }
});

// GET flow (browser redirect)
router.get('/social-login', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) {
      return res.status(400).send("Code not found in query params");
    }

    let provider = "google";
    if (state && state.includes("facebook")) {
      provider = "facebook";
    }

    const result = await handleSocialLogin({ provider, code });
    res.status(200).json(result);

  } catch (error) {
    console.error("Social login error:", error.response?.data || error.message);
    if (error.needManualEmail) {
      return res.status(400).json({ error: error.message, needManualEmail: true });
    }
    res.status(500).json({ error: "Social login failed" });
  }
});

module.exports = router;
