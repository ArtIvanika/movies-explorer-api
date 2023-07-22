const router = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const userRoutes = require('./users');
const moviesRoutes = require('./movies');
const NotFoundError = require('../errors/NotFoundError');
const { createUser, login } = require('../controllers/users');
const auth = require('../middlewares/auth');

router.post('/signup', celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
  }),
}), createUser);

router.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
  }),
}), login);

router.use(auth);

router.use(userRoutes);
router.use(moviesRoutes);

router.use('*', () => {
  throw new NotFoundError('Страница не найдена');
});

module.exports = router;
