import React, { useState, useEffect } from 'react';
import './ReviewerStyles.css';

const PDFViewer = ({ url }) => {
    return (
        <div className="pdf-viewer-container">
            <iframe
                src={`${url}#toolbar=1&navpanes=1`}
                title="PDF Viewer"
                className="pdf-viewer"
            />
        </div>
    );
};

const ReviewerPage = () => {
    const [assignedPDFs, setAssignedPDFs] = useState([]);
    const [selectedPDF, setSelectedPDF] = useState(null);
    const [message, setMessage] = useState('');
    const [review, setReview] = useState({
        comment: '',
        grade: 5
    });

    useEffect(() => {
        fetchAssignedPDFs();
    }, []);    /* Fetches all PDFs assigned to the current reviewer from the server */
    const fetchAssignedPDFs = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/reviewer/assigned-pdfs', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setAssignedPDFs(data);
        } catch (error) {
            console.error('Error fetching assigned PDFs:', error);
            setMessage('Error fetching assigned PDFs');
        }
    };    /* Updates the selected PDF and displays it in the viewer */
    const handlePDFSelect = (pdf) => {
        setSelectedPDF(pdf);
    };    /* Submits the review with grade and comments to the server for the selected PDF */
    const submitReview = async () => {
        if (!selectedPDF) {
            setMessage('Please select a PDF first');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/reviewer/submit-review', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    pdfId: selectedPDF.pdfId,
                    comment: review.comment,
                    grade: review.grade
                })
            });

            const data = await response.json();
            if (response.ok) {
                setMessage('Review submitted successfully');
                setReview({ comment: '', grade: 5 });
                setSelectedPDF(null);
                fetchAssignedPDFs();
            } else {
                setMessage(data.message || 'Error submitting review');
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            setMessage('Error submitting review');
        }
    };

    const [userName, setUserName] = useState('');

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(storedUser.name || '');
    }, []);

    return (
        <div className="reviewer-dashboard">
            <div className="reviewer-content">
                <div className="dashboard-header">
                    <h1>Reviewer Dashboard</h1>
                    <p className="welcome-message">Welcome, {userName}!</p>
                </div>

                {message && (
                    <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}

                <div className="dashboard-container">
                    <div className="review-layout">
                        <div className="pdfs-selector">
                            <h2>Assigned PDFs</h2>
                            <div className="pdf-cards">
                                {assignedPDFs.map(pdf => (
                                    <div 
                                        key={pdf.pdfId} 
                                        className={`pdf-card ${selectedPDF?.pdfId === pdf.pdfId ? 'selected' : ''}`}
                                        onClick={() => handlePDFSelect(pdf)}
                                    >
                                        <h3>{pdf.pdfName}</h3>
                                        <p>Author: {pdf.pdfAuthor}</p>
                                        <p>Assigned: {new Date(pdf.createdAt).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {selectedPDF && (
                            <div className="review-content">
                                <div className="pdf-section">
                                    <PDFViewer url={`http://localhost:5000${selectedPDF.pdfFile}`} />
                                </div>
                                <div className="review-section">
                                    <h2>Review Form</h2>
                                    <div className="review-form">
                                        <div className="grade-input">
                                            <label>Grade (0-10):</label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="10"
                                                value={review.grade}
                                                onChange={(e) => setReview({...review, grade: parseInt(e.target.value)})}
                                            />
                                            <span className="grade-value">{review.grade}</span>
                                        </div>

                                        <div className="comment-input">
                                            <label>Comments:</label>
                                            <textarea
                                                value={review.comment}
                                                onChange={(e) => setReview({...review, comment: e.target.value})}
                                                placeholder="Enter your review comments here..."
                                            />
                                        </div>

                                        <button 
                                            className="submit-review"
                                            onClick={submitReview}
                                            disabled={!review.comment.trim()}
                                        >
                                            Submit Review
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewerPage;
