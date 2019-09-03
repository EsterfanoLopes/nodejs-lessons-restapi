const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

dotenv.config();
const envvars = process.env;

module.exports = {
  createUser: async ({ userInput }, req) => {
    const { email, name, password } = userInput;
    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({ message: 'E-mail is invalid.' });
    }
    if (validator.isEmpty(password) || !validator.isLength(password, { min: 5 })) {
      errors.push({ message: 'Password too short!' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input.');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error('User exists already!');
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, parseInt(envvars.ENCRYPT_ROUNDS));
    
    const user = new User({ email, name, password: hashedPassword });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
  login: async ({ email, password }) => {
    const user = await User.findOne({ email });
    const error = new Error('Email or Password are wrong!');
    error.code = 401;
    if (!user) { throw error; }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) { throw error; }
    const token = jwt.sign({
      userId: user._id.toString(),
      email: user.email
    }, envvars.kawabangaXablau.toString(), { expiresIn: '1h' });
    return { token, userId: user._id.toString() };
  }
};
