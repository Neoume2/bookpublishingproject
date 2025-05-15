const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'alyemamrap@gmail.com',
        pass: 'cnpfvcjljkfoofod'
    }
});

/* Sends notification email to author with review decision, grade, and feedback */
const sendReviewDecisionEmail = async (authorEmail, pdfName, status, grade, comment, chairFeedback) => {
    const mailOptions = {
        from: 'alyemamrap@gmail.com',
        to: authorEmail,
        subject: `Review Decision for "${pdfName}"`,
        html: `
            <h2>Review Decision for "${pdfName}"</h2>
            <p>Status: <strong>${status.toUpperCase()}</strong></p>
            <p>Grade: ${grade}/10</p>
            <h3>Reviewer's Comment:</h3>
            <p>${comment}</p>
            ${chairFeedback ? `<h3>Chair's Feedback:</h3><p>${chairFeedback}</p>` : ''}
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Review decision email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = {
    sendReviewDecisionEmail
};
