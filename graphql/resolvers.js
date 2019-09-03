const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const User = require('../models/user');

dotenv.config();
const envvars = process.env;

module.exports = {
  createUser: async function ({ userInput }, req) {
    const { email, name, password } = userInput;
    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({ message: 'E-mail is invalid.' });
    }
    if (validator.isEmpty(password) || !validator.isLength(password, { min: 5 })) {
      errors.push({ message: 'Password too short!' });
    }
    if (errors.length > 0) {
      throw new Error('Invalid input.');
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
  }
};
