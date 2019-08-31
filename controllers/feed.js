const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator/check');
const dotenv = require('dotenv');

const io = require('../socket');
const Post = require('../models/post');
const User = require('../models/user');

dotenv.config();
const envvars = process.env;

const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => {
    console.log(err);
  });
};

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = parseInt(envvars.ITEMS_PER_PAGE, 10);
  let totalItems;
  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate('creator')
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    res.status(200).json({
      message: 'Fetched posts successfully',
      posts,
      totalItems,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error('No image provided.');
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path;
  const { title, content } = req.body;
  let creator;
  const post = new Post({
    title,
    content,
    imageUrl,
    creator: req.userId,
  });
  post.save()
    .then(result => {
      return User.findById(req.userId)
    }).then(user => {
      creator = user;
      user.posts.push(post);
      return user.save();
    }).then(result => {
      io.getIo().emit('posts', {
        action: 'create',
        post: {
          ...post._doc,
          creator: { _id: req.userId, name: result.name },
        },
      });
      res.status(201).json({
        message: 'Post created successfuly',
        post,
        creator: { _id: creator._id, name: creator.name }
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find Post');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        message: 'Post fetched.',
        post,
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect.');
    error.statusCode = 422;
    throw error;
  }
  const { title, content } = req.body;
  let imageUrl = req.body.image;
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (!imageUrl) {
    const error = new Error('No file picked');
    error.statusCode = 422;
    throw error;
  }
  Post.findById(postId).populate('creator')
    .then(post => {
      if (!post) {
        const error = new Error('Could not find Post');
        error.statusCode = 404;
        throw error;
      }
      if (post.crator._id.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.statusCode = 401;
        throw error;
      }
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }
      post.title = title;
      post.imageUrl = imageUrl;
      post.content = content;
      post.save();
    })
    .then(result => {
      io.getIo().emit('posts', {
        action: 'update',
        post: result,
      })
      res.status(200).json({ message: 'Post updated!', post: result });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findById(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Could not find Post');
        error.statusCode = 404;
        throw error;
      }
      if (!post.creator || post.creator.toString() !== req.userId) {
        const error = new Error('Not authorized!');
        error.statusCode = 401;
        throw error;
      }
      clearImage(post.imageUrl);
      return Post.findByIdAndRemove(postId);
    }).then(result => {
      return User.findById(req.userId);
    }).then(user => {
      user.posts.pull(postId);
      return user.save();
    }).then(result => {
      console.log(result);
      res.status(200).json({ message: 'Deleted post.' });
    }).catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
