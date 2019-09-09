const expect = require('chai').expect;
const sinon = require('sinon');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('../models/user');
const AuthController = require('../controllers/auth');

describe('Auth Controller - Login', function () {
  it('should throw an error with code 500 if accessing the database fails', function (done) {
    sinon.stub(User, 'findOne');
    User.findOne.throws();

    const req = {
      body: {
        email: 'test@test.com',
        password: 'tester'
      }
    };

    AuthController.login(req, {}, () => { }).then(result => {
      expect(result).to.be.an('error');
      expect(result).to.have.property('statusCode', 500);
      done();
    });

    User.findOne.restore();
  });

  it('Should send a response with a valid user status for an existing user', async (done) => {
    dotenv.config();
    const envvars = process.env;

    const MONGODB_URI = `mongodb://${envvars.DB_USER}:${envvars.DB_PASSWORD}@ds219308.mlab.com:19308/suaaplicacao-api-test`;

    mongoose
      .connect(MONGODB_URI)
      .then(result => {
        const user = new User({
          email: 'test@test.com',
          password: 'tester',
          name: 'Test',
          posts: [],
          _id: '5c0f66b979af55031b34728a',
        });
        user.save();
      }).then(() => {
        const req = { userId: '5c0f66b979af55031b34728a' };
        const res = {
          statusCode: 500,
          userStatus: null,
          status: (code) => {
            this.statusCode = code;
            return this;
          },
          json: (data) => this.userStatus = data.status,
        };
        AuthController.getUserStatus(req, res, () => {}).then(() => {
          expect(res.statusCode).to.be.equal(500);
          done();
        });
      }).catch(err => console.log(err));
  });
});