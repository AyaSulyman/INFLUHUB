require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const https = require('https');
const http = require('http');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const loginRoutes = require('../routers/user');
const cors = require('cors')
const bodyParser = require('body-parser')


const app = express();

app.use(express.json());
app.use(cors())
app.use(bodyParser.json())



mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((error) => {
  console.error("MongoDB connection error:", error);
});

  
const verifyRefreshToken = (req, res, next) => {
  const refreshToken = req.headers['refresh-token'];
  console.log("Received refresh token:", refreshToken);
  if (!refreshToken) {
    return res.status(403).send('Refresh token is required');
  }

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      console.log("Token verification error:", err);
      return res.status(403).send('Invalid refresh token');
    }
    req.user = user;
    next();
  });
};

const generateRefreshToken = (userId) => {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  return jwt.sign({ userId }, secret, { expiresIn: '1d' });
};

app.get('/refresh-token', (req, res) => {
  const userId = req.query.userId || 'defaultUser  Id';
  const newRefreshToken = generateRefreshToken(userId);
  res.json({ refreshToken: newRefreshToken });
});

app.get('/status', verifyRefreshToken, (req, res) => {
  res.status(200).json({ message: "Service is up and running" });
});

app.use('/api', loginRoutes);
app.use('/api/authentication', loginRoutes)



const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send("success");
});

const userRouter = require("../routers/user");
app.use(userRouter);


if (process.env.NODE_ENV === 'production') {

  http.createServer(app).listen(port, () => {
    console.log(`Server running on http://influhub-1.onrender.com`);
  });
} else {

const httpsOptions = {
  key: fs.readFileSync('./certs/key.pem'),
  cert: fs.readFileSync('./certs/cert.pem')
};

https.createServer(httpsOptions, app).listen(port,()=> {
  console.log(`Server running on https://influhub-1.onrender.com`);
});


}
