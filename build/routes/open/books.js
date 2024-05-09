"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.booksRouter = void 0;
const utilities_1 = require("../../core/utilities");
const express_1 = __importDefault(require("express"));
const booksRouter = express_1.default.Router();
exports.booksRouter = booksRouter;
booksRouter.get('/get_all_books', (request, response) => {
    const theQuery = 'SELECT * FROM books';
    const values = [];
    utilities_1.pool.query(theQuery, values)
        .then((result) => {
        if (result.rowCount > 0) {
            response.send({
                entries: result.rows,
            });
        }
        else {
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
booksRouter.get('/:authors', (request, response) => {
    const theQuery = 'SELECT * FROM books WHERE authors = $1';
    const values = [request.params.authors];
    console.log(values);
    utilities_1.pool.query(theQuery, values)
        .then((result) => {
        if (result.rowCount >= 1) {
            response.send({
                entry: result.rows[0],
            });
        }
        else {
            response.status(404).send({
                message: 'Author not found',
            });
        }
    })
        .catch((error) => {
        //log the error
        console.error('DB Query error on GET /:get_by_authors');
        console.error(error);
        response.status(500).send({
            message: 'server error - contact support',
        });
    });
});
booksRouter.get('/get_by_rating', (request, response) => {
    const theQuery = 'SELECT * FROM books WHERE rating_avg >= $1';
    const values = [request.query.rating];
    utilities_1.pool.query(theQuery, values)
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
// TODO: Change to DELETE
booksRouter.get('/get_by_range', (request, response) => {
    const theQuery = 'SELECT * FROM books WHERE publication_year >= $1 AND publication_year <= $2';
    const values = [request.query.min, request.query.max];
    utilities_1.pool.query(theQuery, values)
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
//# sourceMappingURL=books.js.map