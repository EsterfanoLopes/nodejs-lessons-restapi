const express = require('express');
const { body } = require('express-validator/check');

const userController = require('../controllers/user');

const router = express.Router();

router.put('/signup');

module.exports = router;
