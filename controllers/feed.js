exports.getPosts = (req, res, next) => {
    res.status(200).json({
        posts: [{ title: 'First Post', content: 'This is the first post!' }],
    });
};

exports.createPost = (req, res, next) => {
    // Create a post in db
    const { title, content } = req.body;

    res.status(201).json({
        message: 'Post created successfuly',
        post: {
            id: new Date().toISOString(),
            title,
            content,
        }
    });
};
