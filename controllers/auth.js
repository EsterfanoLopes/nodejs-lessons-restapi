const { validationResult } = require('express-validator/check');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

exports.login = (req, res, next) => {
  const { email, password } = req.body;
  let loadedUser;
  User.findOne()
    .then(user => {
      if (!user) {
        const error = new Error('A user with this e-mail could not be found.');;
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, user.password);
    }).then(isEqual => {
      if (!isEqual) {
        const error = new Error('Wrong Password.');;
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign({
        email: loadedUser.email,
        userId: loadedUser._id.toString(),
      },
        `${envvars.JWT_SECRET_WORD}`,
        { expiresIn: '1h' }
      );
      res.status(200).json({ token, userId: loadedUser._id.toString() });
    }).catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
}
