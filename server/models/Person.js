const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    PID: {
        type: String,
        required: [true, 'PID is required'],
        unique: true,
        sparse: true
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'approved'],
            message: '{VALUE} is not a valid status'
        },
        default: 'pending'
    },
    assignedRole: {
        type: String,
        enum: {
            values: ['admin', 'author', 'reviewer', 'chair', null],
            message: '{VALUE} is not a valid role'
        },
        default: null
    }
}, { 
    collection: "Person",
    timestamps: true 
});

// More descriptive error logging
personSchema.pre('save', async function(next) {
    try {
        console.log('Pre-save middleware - Saving person:', {
            name: this.name,
            email: this.email,
            PID: this.PID,
            status: this.status,
            assignedRole: this.assignedRole
        });
        next();
    } catch (error) {
        console.error('Pre-save middleware error:', error);
        next(error);
    }
});

personSchema.post('save', function(doc, next) {
    console.log('Post-save middleware - Person saved successfully:', {
        id: doc._id,
        name: doc.name,
        email: doc.email,
        PID: doc.PID,
        status: doc.status,
        assignedRole: doc.assignedRole
    });
    next();
});

const Person = mongoose.model('Person', personSchema);
module.exports = Person;