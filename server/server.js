const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

/* Logs messages to both console and file with timestamp */
function log(msg) {
    const message = `${new Date().toISOString()} - ${msg}`;
    console.log(message);
    fs.appendFileSync('server.log', message + '\n');
}

fs.writeFileSync('server.log', '');

const Person = require('./models/Person');
const Admin = require('./models/Admin');
const Author = require('./models/Author');
const Chair = require('./models/Chair');
const Reviewer = require('./models/Reviewer');
const PDF = require('./models/PDF');
const Comments = require('./models/Comments');
const { sendReviewDecisionEmail } = require('./utils/emailService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection setup with reliable logging
mongoose.set('debug', true);
mongoose.set('strictQuery', false);

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        const conn = await mongoose.connect('mongodb+srv://alyemamrap:alyaly12@cluster0.mkh3o0r.mongodb.net/webproj', {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // List all collections after successful connection
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
        // Set up connection error handlers
        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB disconnected');
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('MongoDB connection closed through app termination');
            process.exit(0);
        });

    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

// Configure multer for PDF uploads
/* Configures PDF file storage with unique filenames and automatic directory creation */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/pdfs';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

// Helper function for PDF file access
const getPDFFilePath = (pdfFileName) => {
    return path.join(__dirname, 'uploads/pdfs', pdfFileName);
};

// Middleware to handle PDF file access
app.use('/pdfs', (req, res, next) => {
    const filePath = getPDFFilePath(path.basename(req.path));
    log(`Attempting to access PDF file: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
        log(`PDF file found: ${filePath}`);
        next();
    } else {
        log(`PDF file not found: ${filePath}`);
        res.status(404).send('PDF file not found');
    }
}, express.static(path.join(__dirname, 'uploads/pdfs')));

// Create necessary directories
['uploads', 'uploads/pdfs'].forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        log(`Created directory: ${dirPath}`);
    }
});

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your-secret-key';

/* Extracts and validates user information from the authentication token */
const getUserFromToken = async (req) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return null;
        
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded) return null;

        // Find user based on decoded information        // Find user with email field included
        let user = await Admin.findById(decoded.userId).select('+email') ||
                  await Author.findById(decoded.userId).select('+email') ||
                  await Chair.findById(decoded.userId).select('+email') ||
                  await Reviewer.findById(decoded.userId).select('+email');

        if (!user) return null;        if (!user.email) {
            console.error('User found but email is missing');
            return null;
        }

        return {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.constructor.modelName.toLowerCase()
        };
    } catch (error) {
        console.error('Error getting user from token:', error);
        return null;
    }
};

/* Handles new user registration and adds them to pending approval queue */
app.post('/api/signup', async (req, res) => {
    console.log('Received signup request:', req.body);
    try {
        const { name, email, password } = req.body;
        
        console.log('Checking for existing user...');
        let existingUser = await Person.findOne({ email }) || 
                          await Admin.findOne({ email }) ||
                          await Author.findOne({ email }) ||
                          await Chair.findOne({ email }) ||
                          await Reviewer.findOne({ email });

        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        console.log('Hashing password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        
        console.log('Creating new person...');
        const person = new Person({
            name,
            email,
            password: hashedPassword,
            PID: 'P' + Date.now(),
            status: 'pending',
            assignedRole: null
        });

        console.log('Attempting to save person...');
        try {
            const savedPerson = await person.save();
            console.log('Person saved successfully:', savedPerson);
            res.status(201).json({ 
                message: 'Registration successful. Waiting for admin approval.',
                userId: savedPerson._id
            });
        } catch (saveError) {
            console.error('Error saving person:', saveError);
            throw saveError;
        }
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            message: 'Error creating user', 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;        // Check all collections for the user (including Person collection for pending users)
        let user = await Admin.findOne({ email }) || 
                  await Author.findOne({ email }) ||
                  await Chair.findOne({ email }) ||
                  await Reviewer.findOne({ email }) ||
                  await Person.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is in Person collection (pending approval)
        if (user.collection.name === 'persons') {
            return res.status(403).json({ 
                message: 'Your account is pending admin approval',
                status: 'pending'
            });
        }        // Create and send JWT token
        const token = jwt.sign(
            { 
                userId: user._id,
                role: user.constructor.modelName.toLowerCase()
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            message: 'Login successful',
            token: token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.constructor.modelName.toLowerCase() // This will be 'admin', 'author', etc.
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

// Admin Routes
app.get('/api/admin/pending-users', async (req, res) => {
    try {
        const pendingUsers = await Person.find({ status: 'pending' });
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending users', error: error.message });
    }
});

/* Assigns approved roles to pending users and moves them to appropriate collections */
app.post('/api/admin/assign-role', async (req, res) => {    try {
        const { userId, role } = req.body;
        
        console.log(`Attempting to assign role ${role} to user ${userId}`);
        
        // Find the person in Person collection
        const person = await Person.findById(userId);
        if (!person) {
            console.log('User not found:', userId);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('Found person:', person);

        // Prepare user data for new role
        const userData = {
            name: person.name,
            email: person.email,
            password: person.password // Password is already hashed
        };// Create user in appropriate collection
        let newUser;
        switch(role.toLowerCase()) {
            case 'admin':
                userData.adminID = 'ADM' + Date.now();
                newUser = new Admin(userData);
                break;
            case 'author':
                userData.authorID = 'AUT' + Date.now();
                newUser = new Author(userData);
                break;
            case 'chair':
                userData.chairID = 'CHR' + Date.now();
                newUser = new Chair(userData);
                break;
            case 'reviewer':
                userData.reviewerID = 'REV' + Date.now();
                newUser = new Reviewer(userData);
                break;            default:
                return res.status(400).json({ message: 'Invalid role' });
        }
        
        console.log('Attempting to save new user with data:', { ...userData, role });
          // Save the user to their new role collection
        const savedUser = await newUser.save();
        console.log('Successfully saved user to role-specific collection:', savedUser);

        // Remove the person from the Person collection since they've been migrated
        await Person.findByIdAndDelete(userId);
        console.log('Successfully removed user from Person collection');

        res.json({ 
            message: 'Role assigned successfully',
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: role.toLowerCase()
            }
        });
    } catch (error) {
        console.error('Role assignment error:', error);
        res.status(500).json({ message: 'Error assigning role', error: error.message });
    }
});

/* Handles PDF file uploads from authors and stores metadata */
app.post('/api/upload-pdf', upload.single('pdfFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No PDF file uploaded' });
        }

        const user = await getUserFromToken(req);
        console.log('User from token:', user); // Debug log

        if (!user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        if (!user.email) {
            return res.status(400).json({ message: 'User email is required' });
        }

        if (user.role !== 'author') {
            return res.status(403).json({ message: 'Only authors can upload PDFs' });
        }

        const newPDF = new PDF({            pdfName: req.body.pdfName || req.file.originalname,
            pdfId: 'PDF' + Date.now(),
            pdfAuthor: user.name,
            pdfFile: `/pdfs/${req.file.filename}`, // Store the relative URL path
            authorEmail: user.email
        });

        await newPDF.save();
        res.status(201).json({ 
            message: 'PDF uploaded successfully',
            pdf: {
                name: newPDF.pdfName,
                id: newPDF.pdfId,
                author: newPDF.pdfAuthor
            }
        });    } catch (error) {
        console.error('PDF upload error:', error);
        
        // Provide more specific error messages
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: 'Validation failed',
                errors: errors
            });
        }

        res.status(500).json({ 
            message: 'Error uploading PDF',
            error: error.message
        });
    }
});

// Route to get author's PDFs
app.get('/api/author/pdfs', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const pdfs = await PDF.find({ pdfAuthor: user.name }, { pdfFile: 0 });
        res.json(pdfs);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching PDFs',
            error: error.message
        });
    }
});

// Route to get all PDFs
app.get('/api/pdfs', async (req, res) => {
    try {
        const pdfs = await PDF.find({}, { pdfFile: 0 }); // Exclude the file data
        res.json(pdfs);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching PDFs',
            error: error.message
        });
    }
});

// Route for chair to get all unassigned PDFs
app.get('/api/chair/pending-pdfs', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'chair') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const pdfs = await PDF.find({ status: 'pending' });
        res.json(pdfs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching PDFs', error: error.message });
    }
});

/* Assigns submitted PDFs to specific reviewers for evaluation */
app.post('/api/chair/assign-reviewer', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'chair') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { pdfId, reviewerId } = req.body;
        const reviewer = await Reviewer.findById(reviewerId);
        if (!reviewer) {
            return res.status(404).json({ message: 'Reviewer not found' });
        }

        const pdf = await PDF.findOne({ pdfId });
        if (!pdf) {
            return res.status(404).json({ message: 'PDF not found' });
        }

        pdf.status = 'assigned';
        pdf.assignedReviewer = reviewer._id;
        pdf.reviewerName = reviewer.name;
        await pdf.save();

        res.json({ message: 'PDF assigned successfully', pdf });
    } catch (error) {
        res.status(500).json({ message: 'Error assigning reviewer', error: error.message });
    }
});

// Route for reviewer to get assigned PDFs
app.get('/api/reviewer/assigned-pdfs', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'reviewer') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const pdfs = await PDF.find({ assignedReviewer: user.id });
        res.json(pdfs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching assigned PDFs', error: error.message });
    }
});

/* Processes reviewer's grade and comments for an assigned PDF */
app.post('/api/reviewer/submit-review', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'reviewer') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { pdfId, comment, grade } = req.body;
        const pdf = await PDF.findOne({ pdfId });
        if (!pdf) {
            return res.status(404).json({ message: 'PDF not found' });
        }

        const newComment = new Comments({
            comment,
            authorID: pdf.pdfAuthor,
            authorEmail: pdf.authorEmail,
            grade,
            PDFID: pdfId,
            pdfName: pdf.pdfName,
            reviewerID: user.id,
            reviewerName: user.name
        });

        await newComment.save();
        pdf.status = 'reviewed';
        pdf.grade = grade;
        await pdf.save();

        res.json({ message: 'Review submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting review', error: error.message });
    }
});

// Route for chair to get reviewed PDFs
app.get('/api/chair/reviewed-pdfs', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'chair') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const pdfs = await PDF.find({ status: 'reviewed' });
        res.json(pdfs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviewed PDFs', error: error.message });
    }
});

/* Handles final accept/reject decisions and notifies authors */
app.post('/api/chair/make-decision', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'chair') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { pdfId, decision, feedback } = req.body;
        const pdf = await PDF.findOne({ pdfId });
        if (!pdf) {
            return res.status(404).json({ message: 'PDF not found' });
        }

        const comment = await Comments.findOne({ PDFID: pdfId });
        if (!comment) {
            return res.status(404).json({ message: 'Review not found' });
        }

        pdf.status = decision;
        await pdf.save();

        comment.status = decision;
        comment.chairFeedback = feedback;
        await comment.save();

        // Send email to author
        await sendReviewDecisionEmail(
            pdf.authorEmail,
            pdf.pdfName,
            decision,
            comment.grade,
            comment.comment,
            feedback
        );

        res.json({ message: 'Decision recorded and email sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error recording decision', error: error.message });
    }
});

// Route to get all reviewers
app.get('/api/reviewers', async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user || user.role !== 'chair') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const reviewers = await Reviewer.find({}, 'name email _id');
        res.json(reviewers);
    } catch (error) {
        console.error('Error fetching reviewers:', error);
        res.status(500).json({ 
            message: 'Error fetching reviewers',
            error: error.message 
        });
    }
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});

