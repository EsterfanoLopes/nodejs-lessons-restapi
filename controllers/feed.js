const { validationResult } = require('express-validator/check');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [
      {
        _id: '1',
        title: 'First Post',
        content: 'This is the first post!',
        imageUrl: 'images/Book.jpg',
        creator: {
          name: 'Fulano',
        },
        createdAt: new Date(),
      }],
  });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed, entered data is incorrect.',
      errors: errors.array(),
    });
  }
  const { title, content } = req.body;
  const post = new Post({
    title,
    content,
    imageUrl: 'images/Book.jpg',
    creator: { name: 'Fulano' },
  });
  post.save()
    .then(result => {
      res.status(201).json({
        message: 'Post created successfuly',
        post: result
      });
    })
    .catch(err => console.log(err));
};
