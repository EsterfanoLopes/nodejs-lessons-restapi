const path = require('path');

const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const graphQlHttp = require('express-graphql');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');
const { clearImage } = require('./util/file');

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, `${new Date().toISOString()}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
}

app.use(bodyParser.json());
app.use(
  multer({ storage: fileStorage, fileFilter }).single('image')
);
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(auth);

app.put('/post-image', (req, res, next) => {
  if (!req.isAuth) { throw new Error('Not authenticated!'); }
  if (!req.file) { return res.status(200).json({ message: 'No file provided!' }); }
  if (req.body.oldPath) { clearImage(req.body.oldPath) }
  return res.status(201).json({ message: 'File stored.', filePath: req.file.path });
});

app.use('/graphql',graphQlHttp({
  schema: graphqlSchema,
  rootValue: graphqlResolver,
  graphiql: true,
  customFormatErrorFn(err) {
    if (!err.originalError) {
      return err;
    }
    const { data, code } = err.originalError;
    const message = err.message || 'An error occurred.';
    return {
      message,
      status: code,
      data,
    }
  }
}));

app.use((error, req, res, next) => {
  console.log(error);
  const { statusCode, message, data } = error;
  res.status(statusCode).json({ message, data });
});

dotenv.config();
const envvars = process.env;

const MONGODB_URI =
  `mongodb://${envvars.DB_USER}:${envvars.DB_PASSWORD}@${envvars.DB_HOST}:${envvars.DB_PORT}/${envvars.DB_NAME}`;

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    const server = app.listen(4000);
    console.log('Running on port 4000!');
  })
  .catch(err => console.log(err));
