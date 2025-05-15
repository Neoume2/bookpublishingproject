const mongoose = require('mongoose');

/* Schema for storing PDF submissions with review status and grading information */
const PDFschema = new mongoose.Schema({
  pdfName: { type: String, required: true },
  pdfId: { type: String, required: true, unique: true },
  pdfAuthor: { type: String, required: true },
  pdfFile: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'assigned', 'reviewed', 'accepted', 'rejected'],
    default: 'pending'
  },
  assignedReviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'Reviewer' },
  reviewerName: { type: String },
  grade: { type: Number, min: 0, max: 10 },
  authorEmail: { type: String, required: true },
}
, { timestamps: true }, { collection: 'PDF' });


const PDF = mongoose.model('PDF', PDFschema);
module.exports = PDF;


