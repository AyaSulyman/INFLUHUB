const express = require('express');
const Message = require('../data/data');
const SignupUser = require('../data/Signup');
const jwt = require('jsonwebtoken');
const User = require('../data/Signup');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto')


const JWT_SECRET = process.env.JWT_SECRET;

const otps = {}

const sendOtpEmail = async (email, otp) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS

        }
    })

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP verification',
        text: `your OTP code is ${otp}`
    };
    await transporter.sendMail(mailOptions)



}


router.post('/message', (req, res) => {
    console.log(req.body);
    const message = new Message(req.body);
    message.save()
        .then((message) => res.status(200).send(message))
        .catch((error) => res.status(400).send(error));
});

router.get('/message', (req, res) => {
    Message.find({})
        .then((messages) => res.status(200).send(messages))
        .catch((error) => res.status(400).send(error));
});


router.post('/signup', async (req, res) => {
    console.log(req.body);
    const { Email, Password, ConfirmPassword } = req.body;
    try {
        if (Password !== ConfirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }


        const existingUser = await User.findOne({ Email });
        if (existingUser) {
            return res.status(400).json({ error: 'User  with this email already exists' });
        }

        const username = Email.split('@')[0];

        const user = new User({
            Email,
            username,

            Password
        });
        await user.save();

        //Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        otps[Email] = { otp, expires: Date.now() + 300000 };


        await sendOtpEmail(Email, otp);


        res.status(201).json({ message: 'OTP sent to your email for verification' });;
    } catch (error) {

        res.status(400).json({ error: error.message || "Signup failed" });
    }
});

//OTP verification route
router.post('/verify-otp', async (req, res) => {
    console.log("Received request:", req.body);
    const { Email, otp } = req.body;
    const storedOtp = otps[Email];
    console.log("Stored OTP:", storedOtp);

    if (!storedOtp || storedOtp.otp !== otp || Date.now() > storedOtp.expires) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ Email });
    const accessToken = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '5m' });

    delete otps[Email];
    res.status(200).json({ accessToken, refreshToken });
});







router.get('/signup', (req, res) => {
    User.find({})
        .then((user) => res.status(200).send(user))
        .catch((error) => res.status(400).send(error));
});


//Middleware to authenticate access tokens
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


router.patch('/signup/:id', authenticateToken, async (req, res) => {
    try {
        const updates = Object.keys(req.body);
        const _id = req.params.id;
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).send('unable to find user');
        }
        updates.forEach((ele) => {
            (user[ele] = req.body[ele]);
        });
        await user.save();
        res.status(200).send(user);
    } catch (error) {
        res.status(500).send(error);
    }
});


router.delete('/signup/:id', authenticateToken, async (req, res) => {
    try {
        const _id = req.params.id;
        const user = await User.findByIdAndDelete(_id, req.body, {
            new: true,
            runValidators: true
        });
        if (!user) {
            return res.status(404).send('unable to find user');
        }
        res.status(200).send(user);
    } catch (error) {
        res.status(500).send(error);
    }
});


//login
router.post('/login', async (req, res) => {

    const { username, Password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'Invalid credentials' });
        }

        const isPasswordValid = await bcryptjs.compare(Password, user.Password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        const userResponse = user.toObject();
        delete userResponse.Password;
        res.status(200).json({
            user: userResponse,
            token
        });
    } catch (error) {

        res.status(500).json({ error: 'Internal server error' });
    }
});


//Complete Registration Route(Supplier or Retailer)
router.post('/registration', (req, res) => {
    const { userType, industry, degree, isFreelancer, brand, digitalPresence } = req.body

    try {
        if (userType == "Supplier") {
            if (!industry || !degree || typeof isFreelancer === "undefined") {
                res.status(400).json({ message: "All fields are required" })
            } else {
                (
                    res.status(200).json({
                        message: "Registered as Supplier",
                        data: {
                            userType,
                            industry,
                            degree,
                            isFreelancer
                        }
                    })
                )
            }

        }
        else if (userType == "Retailer") {
            if (!industry || !brand || typeof digitalPresence === "undefined") {
                res.status(400).json({ message: "All fields are required" })
            }
            else {
                (
                    res.status(200).json({
                        message: "Registered as Retailer",
                        data: {
                            userType,
                            industry,
                            brand,
                            digitalPresence
                        }
                    })
                )
            }
        }
    }
    catch (error) {
        res.status(500).send(error)

    }



})

module.exports = router;
