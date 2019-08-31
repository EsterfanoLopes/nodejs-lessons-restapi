const path = require('path');

const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const feedRoutes = require('./routes/feed');

const app = express();

app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/feed', feedRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  const { statusCode, message } = error;
  res.status(statusCode).json({ message });
});

dotenv.config();
const envvars = process.env;

const MONGODB_URI =
  `mongodb://${envvars.DB_USER}:${envvars.DB_PASSWORD}@${envvars.DB_HOST}:${envvars.DB_PORT}/${envvars.DB_NAME}`;

mongoose
  .connect(MONGODB_URI)
  .then(result => app.listen(4000))
  .catch (err => console.log(err));
