const express = require('express');
const Message = require('../data/data');
const SignupUser = require('../data/Signup');
const jwt = require('jsonwebtoken');
const User = require('../data/Signup');
const router = express.Router();
const bcryptjs = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')


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

        if (!Email.includes('gmail') || !Email.endsWith('.com')) {
            return res.status(400).json({ error: "Email must contain 'gmail' and end with '.com'" });
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

// Resend Otp
router.post('/resend-otp', async (req, res) => {
    const { Email } = req.body;

    try {
        const user = await User.findOne({ Email });
        if (!user) {
            return res.status(404).json({ error: "User  not found" });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        otps[Email] = { otp, expires: Date.now() + 300000 };


        await sendOtpEmail(Email, otp);

        res.status(200).json({ message: 'OTP has been resent to your email' });
    } catch (error) {
        console.error("Error resending OTP:", error);
        res.status(500).json({ error: error.message || "Failed to resend OTP" });
    }
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


//Profile-Onboarding

const multer = require("multer");

const storage = multer.memoryStorage(); 
const upload = multer({ storage });

router.post(
  "/profile-onboarding-submit",
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        email,
        username: requestedUsername,
        CountryCode,
        PhoneNumber,
        userType,
        Industry,
        Degree,
        isFreelancer,
        Type,
        Capital,
        DigitalPresence,
      } = req.body;

      if (!email || !CountryCode || !PhoneNumber || !userType) {
        return res.status(400).json({ error: "All required fields must be filled." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Image file is required." });
      }

    
      const mimeType = req.file.mimetype;
      const base64Image = `data:${mimeType};base64,${req.file.buffer.toString("base64")}`;

      const user = await User.findOne({ Email: email });
      if (!user) return res.status(404).json({ error: "User not found" });

      const username = requestedUsername || email.split("@")[0];

      user.username = username;
      user.CountryCode = CountryCode;
      user.PhoneNumber = PhoneNumber;
      user.userType = userType;
      user.image = base64Image;

      if (userType === "Retailer") {
        if (!Industry || !Degree || typeof isFreelancer === "undefined") {
          return res.status(400).json({ message: "All Retailer fields are required" });
        }
        user.Industry = Industry;
        user.Degree = Degree;
        user.isFreelancer = isFreelancer;
      } else if (userType === "Supplier") {
        if (!Industry || !Type || !Capital || typeof DigitalPresence === "undefined") {
          return res.status(400).json({ message: "All Supplier fields are required" });
        }
        user.Industry = Industry;
        user.Type = Type;
        user.Capital = Capital;
        user.DigitalPresence = DigitalPresence;
        
      } else {
        return res.status(400).json({ message: "Invalid userType" });
      }

      await user.save();
      res.status(200).json({ message: "Profile updated", data: user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  }
);


router.post('/check-username', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ message: "Username is required" });
    }

    const user = await User.findOne({ username });
    if (user) {
        return res.status(400).json({ message: "Username already exists" });
    }

    return res.status(200).json({ message: "Username is available" });
});

router.get('/profile-onboarding-submit', async (req, res) => {
    try {
        const data = await User.find({});
        if (data.length === 0) {
            return res.status(200).json([]);
        }
        res.status(200).send(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while fetching data" });
    }
});


router.get('/profile-onboarding-submit/:_id', async (req, res) => {
    try {
        const _id = req.params._id
        const data = await User.findById(_id);

        if (!data) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while fetching data" });
    }
});


router.get('/profile-onboarding', async (req, res) => {
    try {
        const industriesWithSuppliers = industries.carousel.map(industry => {
            const suppliers = getSuppliersByIndustry(industry.industry);
            return { ...industry, Suppliers: suppliers };
        });
        res.status(200).json({
            industries: industriesWithSuppliers,
            degrees: degree,
            capitals: capital
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to load onboarding options" });
    }
});




//Forgot Password Route
router.post('/forgot-password', async (req, res) => {
    const Email = req.body.Email
    try {
        const user = await User.findOne({ Email: Email });
        if (!user) {
            return res.status(400).json({ error: "User not found" });
        }
        //Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        otps[Email] = { otp, expires: Date.now() + 300000 };


        await sendOtpEmail(Email, otp);


        res.status(201).json({ message: 'OTP sent to your email for verification' });;
    } catch (error) {

        res.status(400).json({ error: error.message || "Error processing request" });
    }
})


//verify OTP reset
router.post('/verify-otp-reset', async (req, res) => {
    const { Email, otp } = req.body;
    const storedOtp = otps[Email];
    console.log("Stored OTP:", storedOtp);

    if (!storedOtp || storedOtp.otp !== otp || Date.now() > storedOtp.expires) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    delete otps[Email];
    return res.status(200).json({ message: "OTP verified successfully, you may reset your password" });

})


//Reset password
router.post('/reset-password', async (req, res) => {
    const { Email, newPassword } = req.body
    console.log("new password", newPassword)

    try {
        const hashedPassword = await bcryptjs.hash(newPassword, 10)
        const user = await User.findOneAndUpdate({ Email }, { Password: hashedPassword }, { new: true })

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        return res.status(200).json({ message: "Password reset successfully" });

    }
    catch (error) {
        res.status(500).json({ error: error.message || "Error resetting password" });

    }
})



//Get all suppliers based on industry
router.post('/supplier-service', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "userId is required." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }


        if (user.userType === 'Supplier') {
            return res.status(403).json({
                error: "Access denied. Suppliers cannot use this service.",
                actualUserType: user.userType
            });
        }

        if (user.userType === 'Retailer') {
            const industry = user.Industry;
            const suppliers = await getSuppliersByIndustry(industry);
            return res.status(200).json({ suppliers });
        }

        return res.status(403).json({
            error: "Access denied. Unknown user type.",
            actualUserType: user.userType
        });

    } catch (error) {
        console.error("Supplier service error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

const getSuppliersByIndustry = (industry) => {
    const industryData = industries.carousel.find(item => item.industry.toLowerCase() === industry.toLowerCase());
    return industryData ? industryData.Suppliers : [];
};


const supplierFlags = JSON.parse(fs.readFileSync(path.join(__dirname, '../json files/SupplierFlags64.json'), 'utf-8'));
const retailerFlags = JSON.parse(fs.readFileSync(path.join(__dirname, '../json files/RetailerFlags64.json'), 'utf-8'));

// Retailer Dashboard Route
router.post('/retailer/dashboard', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) {
            return res.status(400).json({ error: "User  Id is required" });
        }

        const user = await User.findById(userId);
        if (!user || user.userType !== "Retailer") {
            return res.status(403).json({ error: "Access denied" });
        }

        
        const response = {
            featured: retailerFlags.carousel.find(category => category.FEATURED)?.FEATURED.slice(0, 10) || [],
            hotPicks: retailerFlags.carousel.find(category => category["HOT PICKS"])?.["HOT PICKS"].slice(0, 10) || [],
            lastChance: retailerFlags.carousel.find(category => category["LAST CHANCE"])?.["LAST CHANCE"].slice(0, 10) || [],
            competitors: retailerFlags.carousel.find(category => category.COMPETITORS)?.COMPETITORS.slice(0, 10) || []
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

// Supplier Dashboard Route
router.post('/supplier/dashboard', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) {
            return res.status(400).json({ error: "User  Id is required" });
        }

        const user = await User.findById(userId);
        if (!user || user.userType !== "Supplier") {
            return res.status(403).json({ error: "Access denied" });
        }

        const response = {
            featured: supplierFlags.carousel.find(category => category.FEATURED)?.FEATURED.slice(0, 10) || [],
            lowInStock: supplierFlags.carousel.find(category => category[" LOW IN STOCK"])?.[" LOW IN STOCK"].slice(0, 10) || [],
            competitors: supplierFlags.carousel.find(category => category.COMPETITORS)?.COMPETITORS.slice(0, 10) || []
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});




// Retailer Featured Route
router.get('/retailer/featured-suppliers', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }
        const user = await User.findById(userId);
        if (!user || user.userType !== "Retailer") {
            return res.status(403).json({ error: "Access denied" });
        }

        const featuredRetailerCategory = retailerFlags.carousel.find(category => category.FEATURED);
        return res.status(200).json(featuredRetailerCategory ? featuredRetailerCategory.FEATURED : []);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Unable to find featured retailers" });
    }
});

// Supplier Featured Route
router.get('/supplier/featured-suppliers', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }
        const user = await User.findById(userId);
        if (!user || user.userType !== "Supplier") {
            return res.status(403).json({ error: "Access denied" });
        }

        const featuredCategory = supplierFlags.carousel.find(category => category.FEATURED);
        return res.status(200).json(featuredCategory ? featuredCategory.FEATURED : []);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Unable to find featured suppliers" });
    }
});




router.get('/getAllHotPickedSuppliers', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: "Unable to find user" });
        } else if (user.userType === "Retailer") {
            const hotPicksCategory = retailerFlags.carousel.find(category => category["HOT PICKS"]);
            return res.status(200).json(hotPicksCategory ? hotPicksCategory["HOT PICKS"] : []);
        } else {
            return res.status(403).json({ error: "Access denied" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Unable to find hot picked retailers" });
    }
});


router.get('/getAllLastChanceSuppliers', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: "Unable to find user" });
        } else if (user.userType === "Retailer") {
            const lastChanceCategory = retailerFlags.carousel.find(category => category["LAST CHANCE"]);
            return res.status(200).json(lastChanceCategory ? lastChanceCategory["LAST CHANCE"] : []);
        } else {
            return res.status(403).json({ error: "Access denied" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Unable to find last chance retailers" });
    }
});


router.get('/getAllLowInStockSuppliers', async (req, res) => {
    try {
        const userId = req.headers['user-id']; 
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ error: "Unable to find user" });
        } else if (user.userType === "Supplier") {
            console.log('User  :', user);
            console.log('Supplier Flags:', supplierFlags);
            const lowInStockCategory = supplierFlags.carousel.find(category => category[" LOW IN STOCK"]);
            console.log('Low In Stock Category:', lowInStockCategory);
            return res.status(200).json(lowInStockCategory ? lowInStockCategory[" LOW IN STOCK"] : []);
        } else {
            return res.status(403).json({ error: "Access denied" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Unable to find low in stock suppliers" });
    }
});



//get competitors of the same industry
const getCompetitorsBySameIndustry = async (industry, _id, userType) => {
    if (!industry) return [];

    try {
        return await User.find({
            userType: userType,
            Industry: { $regex: new RegExp(industry, 'i') },
            _id: { $ne: _id }
        }).select('-Password');
    } catch (error) {
        console.error('Error fetching competitors:', error);
        return [];
    }
};


   // Endpoint for Retailers
   router.post('/retailer/competitors', async (req, res) => {
       try {
           const userId = req.headers['user-id'];
           if (!userId) {
               return res.status(400).json({ error: "userId is required" });
           }

           const currentUser  = await User.findById(userId);
           if (!currentUser  || currentUser .userType !== "Retailer") {
               return res.status(403).json({ error: "Access denied" });
           }

           const matchingRetailers = await getCompetitorsBySameIndustry(currentUser .Industry, currentUser ._id, "Retailer");

           
           const response = matchingRetailers.map(retailer => ({
               id: retailer._id,
               name: retailer.username, 
               image: retailer.image || 'D.png' 
           }));

           res.status(200).json(response);
       } catch (error) {
           console.error(error);
           res.status(500).json({ error: "Server error" });
       }
   });
   


// Endpoint for Suppliers
router.post('/supplier/competitors', async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) {
            return res.status(400).json({ error: "userId is required" });
        }

        const currentUser  = await User.findById(userId);
        if (!currentUser  || currentUser .userType !== "Supplier") {
            return res.status(403).json({ error: "Access denied" });
        }

        const matchingSuppliers = await getCompetitorsBySameIndustry(currentUser .Industry, currentUser ._id, "Supplier");

        const response = matchingSuppliers.map(supplier => ({
            id: supplier._id,
            name: supplier.username,
            image: supplier.image || 'D.png' 
        }));

        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});


module.exports = router;
