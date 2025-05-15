const mongoose = require('mongoose');

const authorSchema = new mongoose.Schema(
{

    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    authorID: {
        type: String,
        required: true,
        unique: true,
    },
}, { 
    collection: 'Author',
    timestamps: true 
});

const Author = mongoose.model('Author', authorSchema);
module.exports = Author;
