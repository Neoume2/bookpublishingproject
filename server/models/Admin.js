const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
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
    },    adminID: {
        type: String,
        required: true,
        unique: true,
    },
}, { 
    collection: "Admin",
    timestamps: true 
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;