const mongoose = require('mongoose');
const chairSchema = new mongoose.Schema({
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
    chairID: {
        type: String,
        required: true,
        unique: true,
    },
}, { 
    collection: 'Chair',
    timestamps: true 
});
const Chair = mongoose.model('Chair', chairSchema);
module.exports = Chair;
