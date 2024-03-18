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

  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.password))) {
    // Generate JWT token
    const token = generateJWT(user.id);

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token,
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

const getUser = asyncHandler(async (req, res) => {
  res.json(req.user);
});

const generateJWT = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};
module.exports = {
  registerUser,
  loginUser,
  getUser,
};
