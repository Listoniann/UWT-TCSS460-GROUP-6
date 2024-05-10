import { pool } from '../../core/utilities';
import express, { NextFunction, Request, Response, Router } from 'express';

const booksRouter: Router = express.Router();

interface IRatings {
    average: number;
    count: number;
    rating_1: number;
    rating_2: number;
    rating_3: number;
    rating_4: number;
    rating_5: number;
}

booksRouter.get('/books', (request: Request, response: Response) => {
    const theQuery = 'SELECT * FROM books';
    const values = [];

    pool.query(theQuery, values)
        .then((result) => {
            if (result.rowCount > 0) {
                response.send({
                    entries: result.rows,
                });
            } else {
                response.status(404).send({
                    message: 'No Books found',
                    code: 404,
                });
            }
        })
        .catch((error) => {
            //log the error
            console.error('DB Query error on GET by priority');
            console.error(error);
            response.status(500).send({
                message: 'server error - contact support',
            });
        });
});

/**
 * @api {get} /author/:author Request to retrieve author
 *
 * @apiDescription Request to retrieve books by author in the DB
 *
 * @apiName author
 * @apiGroup Books
 *
 * @apiParams author the name of author
 *
 * @apiSuccess (Success 201) {String[]} books the aggregate of all books as the following string:
 *      "{<code>isbn13</code>: <code>books isbn13</code>,
 *      <code>authors</code>: <code>books authors</code>,
 *      <code>publication</code>: <code>books publication year</code>,
 *      <code>original_title</code>: <code>books original title</code>,
 *      <code>title</code>: <code>books title</code>,
 *      <code>ratings</code>: {
 *          <code>average</code>: <code>books average rating</code>,
 *          <code>count</code>: <code>books count of total ratings</code>,
 *          <code>rating_1</code>: <code>books count of 1 star ratings</code>,
 *          <code>rating_2</code>: <code>books count of 2 star ratings</code>,
 *          <code>rating_3</code>: <code>books count of 3 star ratings</code>,
 *          <code>rating_4</code>: <code>books count of 4 star ratings</code>,
 *          <code>rating_5</code>: <code>books count of 5 star ratings</code>
 *      },
 *      <code>icons</code>: {
 *          <code>large</code>: <code>books large icon</code>,
 *          <code>small</code>: <code>books small icon</code>,
 *      }}"
 *
 *
 * @apiError (404: Author not Found) {string} message "Author not found"
 * @apiError (500: Server Error) {string} message "server error - contact support"
 */
booksRouter.get('/author/:author', (request, response) => {
    const theQuery = 'SELECT * FROM books WHERE authors = $1';
    const values = [request.params.author];

    pool.query(theQuery, values)
        .then((result) => {
            if (result.rowCount >= 1) {
                response.status(201).send({
                    entry: result.rows,
                });
            } else {
                response.status(404).send({
                    message: 'Author not found',
                });
            }
        })
        .catch((error) => {
            //log the error
            console.error('DB Query error on GET /:get_by_author');
            console.error(error);
            response.status(500).send({
                message: 'server error - contact support',
            });
        });
});

booksRouter.get('/get_by_rating', (request, response) => {
    const theQuery = 'SELECT * FROM books WHERE rating_avg >= $1';
    const values = [request.query.rating];

    pool.query(theQuery, values)
        .then((result) => {
            response.send({
                books: result.rows,
            });
        })
        .catch((error) => {
            console.error('DB Query error on GET /book_by_rating');
            console.error(error);
            response.status(500).send({
                message: 'Server error - contact support',
            });
        });
});

/**
 * @api {get} /year/:year Request to retrieve year
 *
 * @apiDescription Request to retrieve books by year in the DB
 *
 * @apiName year
 * @apiGroup Books
 *
 * @apiParams year publication year of book
 *
 * @apiSuccess (Success 201) {String[]} books the aggregate of all books as the following string:
 *      "{<code>isbn13</code>: <code>books isbn13</code>,
 *      <code>authors</code>: <code>books authors</code>,
 *      <code>publication</code>: <code>books publication year</code>,
 *      <code>original_title</code>: <code>books original title</code>,
 *      <code>title</code>: <code>books title</code>,
 *      <code>ratings</code>: {
 *          <code>average</code>: <code>books average rating</code>,
 *          <code>count</code>: <code>books count of total ratings</code>,
 *          <code>rating_1</code>: <code>books count of 1 star ratings</code>,
 *          <code>rating_2</code>: <code>books count of 2 star ratings</code>,
 *          <code>rating_3</code>: <code>books count of 3 star ratings</code>,
 *          <code>rating_4</code>: <code>books count of 4 star ratings</code>,
 *          <code>rating_5</code>: <code>books count of 5 star ratings</code>
 *      },
 *      <code>icons</code>: {
 *          <code>large</code>: <code>books large icon</code>,
 *          <code>small</code>: <code>books small icon</code>,
 *      }}"
 *
 * @apiError (404: Year not Found) {string} message "Year not found"
 * @apiError (500: Server Error) {string} message "server error - contact support"
 */
booksRouter.get('/year/:year', (request, response) => {
    const theQuery = 'SELECT * FROM books WHERE publication_year = $1';
    const values = [request.params.year];

    pool.query(theQuery, values)
        .then((result) => {
            if (result.rowCount >= 1) {
                response.status(201).send({
                    books: result.rows,
                });
            } else {
                response.status(404).send({
                    message: 'Year not found',
                });
            }
        })
        .catch((error) => {
            console.error('DB Query error on GET /book_by_year');
            console.error(error);
            response.status(500).send({
                message: 'Server error - contact support',
            });
        });
});

// TODO: Change to DELETE
booksRouter.get('/get_by_range', (request, response) => {
    const theQuery =
        'SELECT * FROM books WHERE publication_year >= $1 AND publication_year <= $2';
    const values = [request.query.min, request.query.max];

    pool.query(theQuery, values)
        .then((result) => {
            response.send({
                books: result.rows,
            });
        })
        .catch((error) => {
            console.error('DB Query error on GET /book_by_range');
            console.error(error);
            response.status(500).send({
                message: 'Server error - contact support',
            });
        });
});

export { booksRouter };
