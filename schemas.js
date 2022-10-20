const Joi = require('joi')

module.exports.bookSchema = Joi.object({
    books: Joi.object({
        title: Joi.string().required(),
        price: Joi.number().required().min(0),
        genre: Joi.string().required(),
        image: Joi.string().required(),
        description: Joi.string().required(),
    }).required()
})

module.exports.reviewSchema = Joi.object({
    review: Joi.object(
        {
            rating: Joi.number().required().min(1).max(5),
            body: Joi.string().required()
        }
    ).required()
})