const Movie = require('../models/movie');

const NotFoundError = require('../errors/NotFoundError'); // 404
const BadRequest = require('../errors/BadRequest'); // 400
const ForbiddenError = require('../errors/ForbiddenError'); // 403

const getMovies = (req, res, next) => {
  Movie.find({ owner: req.user._id.toString() })
    .then((movies) => res.send(movies))
    .catch(next);
};

const createMovie = (req, res, next) => {
  const {
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    thumbnail,
    movieId,
    nameRU,
    nameEN,
  } = req.body;

  Movie.create({
    country,
    director,
    duration,
    year,
    description,
    image,
    trailerLink,
    thumbnail,
    movieId,
    nameRU,
    nameEN,
    owner: req.user._id,
  })
    .then((movie) => res.status(201).send(movie))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        return next(new BadRequest('Переданы некорректные данные при создании фильма'));
      }
      return next(err);
    });
};

const deleteMovieById = (req, res, next) => {
  Movie.findById(req.params._id)
    .then((movie) => {
      if (!movie) {
        throw new NotFoundError('Данный фильм не найден');
      }
      if (movie.owner.toString() !== req.user._id) {
        throw new ForbiddenError('Недостаточно прав для удаления фильма');
      }
      Movie.deleteOne(movie)
        .then(() => res.status(200).send(movie))
        .catch((err) => {
          if (err.name === 'ValidationError') {
            next(new BadRequest('Некоректный запрос'));
          }
          return next(err);
        });
    })
    .catch(next);
};

module.exports = {
  getMovies,
  createMovie,
  deleteMovieById,
};
