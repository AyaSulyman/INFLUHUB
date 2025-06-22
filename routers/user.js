const express = require('express');
const Message = require('../data/data');
const SignupUser = require('../data/Signup');
const jwt = require('jsonwebtoken');
const User = require('../data/Signup');
const router = express.Router();
const bcryptjs = require('bcryptjs')


const JWT_SECRET = "975a56e795c8b500c1awc6b96207ad8bcd99b5455311611db70241714513beec6yazzd66247d802fc66a3d703a06ea4a8d110453309089a40566441523"


//success message
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


//signup
router.post('/signup', async (req, res) => {
    console.log(req.body);
    const { Email, Password, ConfirmPassword } = req.body;
    try {
        if (Password !== ConfirmPassword) {
            return res.status(400).json({ error: "Passwords do not match" });
        }

        const username = Email.split('@')[0];

        const user = new User({
            Email,
            username,
            Password: await bcryptjs.hash(Password, 10)
        });
        await user.save();

        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ user, token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/signup', (req, res) => {
    User.find({})

        .then((user) => res.status(200).send(user))
        .catch((error) => res.status(400).send(error))
})


// Middleware to authenticate token
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


//update user
router.patch('/signup/:id', authenticateToken, async (req, res) => {
    try {
        const updates = Object.keys(req.body)
        const _id = req.params.id
        const user = await User.findById(_id)

        if (!user) {
            return res.status(404).send('unable to find user')
        }
        updates.forEach((ele) => {
            (user[ele] = req.body[ele])
        })

        await user.save();

        res.status(200).send(user)

    }
    catch (error) {
        res.status(500).send(error)
    }
})

//delete user
router.delete('/signup/:id', authenticateToken, async (req, res) => {
    try {
        const _id = req.params.id
        const user = await User.findByIdAndDelete(_id, req.body, {
            new: true,
            runValidators: true
        })
        if (!user) {
            return res.status(404).send('unable to find user')
        }
        res.status(200).send(user)

    }
    catch (error) {
        res.status(500).send(error)


    }
})


//login

router.post('/login', async (req, res) => {
    const { username, password } = req.body; 
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'Invalid credentials' });
        }
    
        const isPasswordValid = await bcryptjs.compare(password, user.Password);
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
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;
