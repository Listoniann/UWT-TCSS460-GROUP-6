
import {pool} from "../../core/utilities";
import express, {NextFunction, Request, Response, Router} from 'express';

const bookFormat = (resultRow) => `${resultRow.isbn13}, ${resultRow.authors}, ${resultRow.publication_year}, ${resultRow.original_title}, ${resultRow.title}, ${resultRow.rating_avg}, ${resultRow.rating_count}, ${resultRow.rating_1_star}, ${resultRow.rating_2_star}, ${resultRow.rating_3_star}, ${resultRow.rating_4_star}, ${resultRow.rating_5_star}, ${resultRow.image_url}}, ${resultRow.image_small_url}`;

const isbnFormat = (resultRow) =>
    `{${resultRow.isbn13}}] says: ${resultRow.message}`;

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

interface IUrlIcon {
    large: string;
    small: string;
}

interface IBook {
    isbn13: number;
    authors: string;
    publication: number;
    original_title: string;
    title: string;
    ratings: IRatings;
    icons: IUrlIcon;
}

// use this function to format your response, see line 98 for example
function formatBooks(books): IBook[] {
    return books.map((book) => ({
        isbn13: book.isbn13,
        authors: book.authors,
        publication: book.publication_year,
        original_title: book.original_title,
        title: book.title,
        ratings: {
            average: book.rating_avg,
            count: book.rating_count,
            rating_1: book.rating_1_star,
            rating_2: book.rating_2_star,
            rating_3: book.rating_3_star,
            rating_4: book.rating_4_star,
            rating_5: book.rating_5_star,
        } as IRatings,
        icons: {
            large: book.image_url,
            small: book.image_small_url,
        } as IUrlIcon,
    }));
}


/**
 * @api {get} /books/get_by_rating/:rating Retrieve books by average rating
 * @apiDescription Retrieves books from the database that have an average rating of the rating specified, rounded down to the nearest integer.
 * @apiName GetByRating
 * @apiGroup Books
 * @apiParam {Number} rating The minimum average rating to filter books by. Must be between 1 and 5 inclusive.
 * @apiSuccess {Object[]} books Array of books each containing isbn13, authors, publication year, original title, title, average rating, ratings count, icons.
 * @apiError (400: Invalid Rating) {String} message "Invalid rating parameter. Please specify a rating between 1 and 5."
 * @apiError (404: No Books Found) {String} message "No books found with that rating."
 * @apiError (500: Server Error) {String} message "Server error - contact support."
 */
booksRouter.get('/get_by_rating/:rating', (request, response) => {
    if (!request.query.rating) {
        return response.status(400).send({ message: "Rating parameter is required." });
    }

    const rating = parseInt(request.query.rating as string);
    if (isNaN(rating) || rating < 1 || rating > 5) {
        return response.status(400).send({ message: "Invalid rating parameter. Please specify a rating between 1 and 5." });
    }

    const theQuery = 'SELECT * FROM books WHERE FLOOR(rating_avg) = $1';
    const values = [rating];

    pool.query(theQuery, values)
        .then((result) => {
            if (result.rows.length === 0) {
                return response.status(404).send({ message: "No books found with that rating." });
            }
            response.send({
                books: formatBooks(result.rows)
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
 * @api {delete} /books/delete_by_range/:min/:max Delete books by publication year
 * @apiDescription Deletes book entries from the database based on their publication year falling within a specified range. This endpoint will return the number of deleted records.
 * @apiName DeleteByPublicationYear
 * @apiGroup Books
 * @apiParam (Query Parameter) {Number} min The minimum publication year to filter and delete books by.
 * @apiParam (Query Parameter) {Number} max The maximum publication year to filter and delete books by.
 * @apiSuccess {String} message Confirmation message indicating successful deletion.
 * @apiSuccess {Number} deletedCount The number of books deleted.
 * @apiError (400: Invalid Parameters) {String} message "Invalid date parameters. Please ensure 'min' is less than 'max' and both are valid years."
 * @apiError (404: No Books Found) {String} message "No books found within that date range."
 * @apiError (500: Server Error) {String} message "Server error - contact support."
 */
booksRouter.delete('/books/delete_by_range/:min/:max', (request, response) => {
    const theQuery = 'DELETE FROM books WHERE publication_year >= $1 AND publication_year <= $2';
    const values = [request.query.min, request.query.max];

    const min = parseInt(request.query.min as string);
    const max = parseInt(request.query.max as string);

    if (isNaN(min) || isNaN(max) || min > max) {
        return response.status(400).send({ message: "Invalid date parameters. Please specify a min and max publication year. min must be less than max." });
    }

    pool.query(theQuery, values)
        .then((result) => {
            response.send({
                message: 'Books successfully deleted',
                deletedCount: result.rowCount,
            });
        })
        .catch((error) => {
            console.error('DB Query error on DELETE /delete_by_range');
            console.error(error);
            response.status(500).send({
                message: 'Server error - contact support',
            });
        });
});














































/**
 * @api {get} /books/get_by_isbn/
 * @apiDescription retrieves book information from the database based on ISBN.
 * @apiName GetByISBN
 * @apiGroup Books
 * @apiSuccess {Object} books containing isbn13, authors, publication year, original title, title, average rating, ratings count, icons.
 * @apiError (404: No Books Found) {String} message "No books found with that rating."
 * @apiError (500: Server Error) {String} message "Server error - contact support."
 */
booksRouter.get('/get_by_isbn', (request: Request, response: Response) => {
    const theQuery = 'SELECT * FROM books WHERE isbn13 = $1';
    const values = [request.query.isbn];
    pool.query(theQuery, values)
        .then((result) => {
            console.log("FART! Row-Count: " + result.rowCount);
            if (result.rowCount == 1) {
                response.send({
                    entry: bookFormat(result.rows[0]),
                });
            } else {
                response.status(404).send({
                    message: 'ISBN not found',
                });
            }
        })
});



/**
 * @api {get} /books/create_new_book/
 * @apiDescription creates new book entry in database.
 * @apiName CreateNewBook
 * @apiGroup Books
 * @apiSuccess {Object} the book created containing isbn13, authors, publication year, original title, title, average rating, ratings count, icons.
 * @apiError (409: No Books Found) {String} message "ISBN13 already exists"
 * @apiError (500: Server Error) {String} message "Server error - contact support."
 */
booksRouter.post('/create_new_book', (request: Request, response: Response) => {
    const theQuery =
        'INSERT INTO books(ISBN13, Authors, Publication_year, Original_title, title, rating_avg, Rating_count,Rating_1_star,Rating_2_star,Rating_3_star,Rating_4_star,Rating_5_star,Image_url, Image_small_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *';
    const values = [
        request.body.isbn13,
        request.body.authors,
        request.body.publication_year,
        request.body.original_title,
        request.body.title,
        request.body.rating_avg,
        request.body.rating_count,
        request.body.rating_1_star,
        request.body.rating_2_star,
        request.body.rating_3_star,
        request.body.rating_4_star,
        request.body.rating_5_star,
        request.body.image_url,
        request.body.image_small_url,
    ];

    pool.query(theQuery, values)
        .then((result) => {
            response.status(201).send({
                entry: result.rows[0],
            });
        })
        .catch((error) => {
            console.error('DB Query error on POST');
            console.error(error);
            if (error.code === '23505') { 
                console.error('ISBN13 already exists');
                response.status(409).send({
                    message: 'ISBN13 already exists',
                });
            } else {
                response.status(500).send({
                    message: 'Server error - contact support',
                });
            }
        });
});

export {booksRouter};


