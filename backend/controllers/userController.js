const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../model/userModel");

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please complete all fields");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  // Generate JWT token
  const token = generateJWT(user.id);

  res.status(201).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    token,
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if both email and password are provided
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide both email and password");
  }

  // Attempt to find the user by email
  const user = await User.findOne({ email });

  if (!user) {
    // If no user is found, return a specific error message
    res.status(404);
    throw new Error("No account found with that email. Please register.");
  }

  // Compare the provided password with the stored hashed password
  if (await bcrypt.compare(password, user.password)) {
    // If passwords match, generate a JWT token
    const token = generateJWT(user.id);

    // Respond with user details and the token
    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token,
    });
  } else {
    // If passwords do not match, return a specific error message
    res.status(401);
    throw new Error("Incorrect password. Please try again.");
  }
});

const getUser = asyncHandler(async (req, res) => {
  res.json(req.user);
});

const generateJWT = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};
module.exports = {
  registerUser,
  loginUser,
  getUser,
};
