const mongoose = require('mongoose')
const review = require('./review')
const Schema = mongoose.Schema

const bookSchema = new Schema({
    title: String,
    image: String,
    genre: String,
    price: String,
    description: String,
    location: String,
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
})

bookSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('Book', bookSchema)