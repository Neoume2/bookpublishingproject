const mongoose = require('mongoose');
const reviewerSchema = new mongoose.Schema({
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
    reviewerID: {
        type: String,
        required: true,
        unique: true,
    },
}, { 
    collection: 'Reviewer',
    timestamps: true 
});

const Reviewer = mongoose.model('Reviewer', reviewerSchema);
module.exports = Reviewer;