const User = require("../models/User")
const bcrypt = require("bcryptjs")
const jwt  = require("jsonwebtoken")

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, profileImageUrl } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      profileImageUrl,
    });

    console.log("User created:", user);

    // Generate token safely
    let token;
    try {
      token = generateToken(user._id);
      console.log("Token generated:", token);
    } catch (tokenError) {
      console.error("Token generation error:", tokenError);
      return res.status(500).json({ message: "Token generation failed" });
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      token,
    });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
//@desc login user
//@route POST/api/auth/login
//@access Public

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


//@desc Get user profile 
//@route GET '/api/auth/profile
//@access Private (Requires jwt)

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


module.exports = {registerUser,loginUser,getUserProfile}