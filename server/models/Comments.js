const mongoose = require('mongoose');

/* Schema for storing reviewer comments and grades for PDF submissions */
const CommentsSchema = new mongoose.Schema({
    comment: {
        type: String,
        required: true,
    },
    authorID: {
        type: String,
        required: true,
    },
    authorEmail: {
        type: String,
        required: true,
    },
    grade: {
        type: Number,
        required: true,
        min: 0,
        max: 10
    },
    PDFID: {
        type: String,
        required: true,
    },
    pdfName: {
        type: String,
        required: true,
    },
    reviewerID: {
        type: String,
        required: true,
    },
    reviewerName: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    chairFeedback: {
        type: String
    }
}
, { collection: 'Comments' });

const Comments = mongoose.model('Comments', CommentsSchema);
module.exports = Comments;