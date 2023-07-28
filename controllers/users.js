const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const { NODE_ENV, JWT_SECRET } = process.env;
const User = require('../models/user');
const NotFoundError = require('../errors/NotFoundError'); // 404
const BadRequest = require('../errors/BadRequest'); // 400
const ConflictingRequest = require('../errors/ConflictingRequest'); // 409

const getUser = (req, res, next) => {
  User
    .findById(req.user._id)
    .orFail(() => next(new NotFoundError('Пользователь по указанному _id не найден')))
    .then((user) => res.send(user))
    .catch(next);
};

const createUser = (req, res, next) => {
  const {
    name, email, password,
  } = req.body;
  bcrypt.hash(password, 10)
    .then((hash) => {
      User.create({
        name, email, password: hash,
      })
        .then((user) => {
          const { _id } = user;
          res.status(201).send({
            name, email, _id,
          });
        })
        .catch((err) => {
          if (err.name === 'ValidationError') {
            return next(new BadRequest('Переданы некорректные данные'));
          }
          if (err.code === 11000) {
            return next(new ConflictingRequest('Пользователь с такой почтой уже существует'));
          }
          return next(err);
        });
    })
    .catch(next);
};

const updateUser = (req, res, next) => {
  const { name, email } = req.body;
  User.findByIdAndUpdate(
    req.user._id,
    { name, email },
    {
      new: true,
      runValidators: true,
    },
  )
    .then((user) => {
      if (!user) {
        throw new NotFoundError('Пользователь с указанным _id не найден');
      }
      res.send(user);
    })
    .catch((err) => {
      if (err.code === 11000) {
        return next(new ConflictingRequest('Пользователь с таким email уже зарегистрирован'),
        );
      }
      if (err.name === 'ValidationError') {
        return next(new BadRequest('Переданы некорректные данные при обновлении профиля'));
      }
      return next(err);
    });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  return User.findUserByCredentials(email, password)
    .then((user) => {
      // создадим токен
      const token = jwt.sign({ _id: user._id }, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret');
      // вернём токен
      res.send({ token });
    })
    .catch(next);
};

module.exports = {
  getUser,
  createUser,
  updateUser,
  login,
};
