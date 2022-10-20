const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const ejsMate = require('ejs-mate')
const Joi = require('joi')
const { bookSchema, reviewSchema } = require('./schemas.js')
const catchAsync = require('./utils/catchAsync')
const ExpressError = require('./utils/ExpressError')
const methodOverride = require('method-override')
const book = require('./models/book')
//const { findByIdAndUpdate, validate } = require('./models/book')
const Review = require('./models/review')
const { findById } = require('./models/review')

mongoose.connect('mongodb://localhost:27017/books', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
    console.log("Database connected")
})

const app = express()

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }))  // parses req.body. default req.body is undefined
app.use(methodOverride('_method'))

const validatebook = (req, res, next) => {
    // Joi is used for server side validation
    // in case you somehow bypass the express
    // you somehow bypass the client side 
    // bootstrap validation in the form. In this
    // case we use Joi to detect if the book 
    // created has all of the required aspects. If 
    // not it will give an error and that error
    // can be printed out.
    const { error } = bookSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    }
    else {
        next()
    }
}

const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    }
    else {
        next()
    }
}

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/books', catchAsync(async (req, res) => {
    const books = await book.find({})
    res.render('books/index', { books })
}))

app.get('/books/new', (req, res) => {
    res.render('books/new')
})

app.post('/books', validatebook, catchAsync(async (req, res, next) => {
    // if (!req.body.book) throw new ExpressError('Invalid book Data', 400) 

    // This will throw error if req.body has nothing in it
    // meaning that someone created an empty new book. We have our client side validation using our form
    // but the problem is someone can send a request using a tool like postman which can bypass that. Therefore 
    // by throwing this error we can then catch it with our error handler at the bottom.
    const books = new book(req.body.books)
    await books.save()
    res.redirect(`/books/${books._id}`)
}))

app.get('/books/:id', catchAsync(async (req, res) => {
    const { id } = req.params
    const books = await book.findById(id).populate('reviews')
    console.log(books)
    res.render('books/show', { books })
}))

app.get('/books/:id/edit', catchAsync(async (req, res) => {
    const books = await book.findById(req.params.id)
    res.render('books/edit', { books })
}))

app.put('/books/:id', validatebook, catchAsync(async (req, res) => {
    const { id } = req.params;
    const books = await book.findByIdAndUpdate(id, { ...req.body.books })
    res.redirect(`/books/${books._id}`)
}))

app.delete('/books/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await book.findByIdAndDelete(id);
    res.redirect('/books')
}))

app.post('/books/:id/reviews', validateReview, catchAsync(async (req, res) => {
    const books = await book.findById(req.params.id)
    const review = new Review(req.body.review)
    books.reviews.push(review)
    await review.save()
    await books.save()
    res.redirect(`/books/${books._id}`)
}))

app.delete('/books/:id/reviews/:reviewId', catchAsync(async (req, res) => {
    const { id, reviewId } = req.params
    await book.findByIdAndUpdate(id, { $pull: { reviews: reviewId } })
    await Review.findByIdAndDelete(req.params.reviewId)
    res.redirect(`/books/${id}`)
}))

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})


app.use((err, req, res, next) => {
    // our custom error handler will intercept any errors that was 
    // thrown in any of the request above. It will get the status
    // and the message and show that message on the screen.
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, something went wrong!'
    res.status(statusCode).render('error', { err })
})

app.listen(3000, () => {
    console.log("Serving on Port 3000")
})