const { validationResult } = require('express-validator/check');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

dotenv.config();
const envvars = process.env;

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed.');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const { email, name, password } = req.body;
  bcrypt
    .hash(password, parseInt(`${process.env.ENCRYPT_ROUNDS}`, 10))
    .then(hashedPassword => {
      const user = new User({
        email,
        password: hashedPassword,
        name,
      });
      return user.save();
    }).then(result => {
      res.status(201).json({
        message: 'User Created!',
        userId: result._id
      });
    }).catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}
