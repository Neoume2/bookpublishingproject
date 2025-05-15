import React, { useState, useEffect } from 'react';
import './ChairStyles.css';

const ChairPage = () => {
    const [pendingPDFs, setPendingPDFs] = useState([]);
    const [reviewedPDFs, setReviewedPDFs] = useState([]);
    const [reviewers, setReviewers] = useState([]);
    const [feedbackTexts, setFeedbackTexts] = useState({});
    const [selectedReviewer, setSelectedReviewer] = useState('');
    const [selectedPdfReviewers, setSelectedPdfReviewers] = useState({});
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('pending');

    useEffect(() => {
        fetchPDFs();
        fetchReviewers();
    }, []);

    const fetchPDFs = async () => {
        try {
            // Fetch pending PDFs
            const pendingResponse = await fetch('http://localhost:5000/api/chair/pending-pdfs', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const pendingData = await pendingResponse.json();
            setPendingPDFs(pendingData);

            // Fetch reviewed PDFs
            const reviewedResponse = await fetch('http://localhost:5000/api/chair/reviewed-pdfs', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const reviewedData = await reviewedResponse.json();
            setReviewedPDFs(reviewedData);
        } catch (error) {
            console.error('Error fetching PDFs:', error);
            setMessage('Error fetching PDFs');
        }
    };    const fetchReviewers = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/reviewers', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            if (response.ok) {
                setReviewers(data);
            } else {
                setMessage(data.message || 'Error fetching reviewers');
            }
        } catch (error) {
            console.error('Error fetching reviewers:', error);
            setMessage('Error loading reviewers. Please try again.');
        }
    };    const assignReviewer = async (pdfId) => {
        const selectedReviewerId = selectedPdfReviewers[pdfId];
        if (!selectedReviewerId) {
            setMessage('Please select a reviewer first');
            return;
        }

        try {
            setMessage(''); // Clear any previous messages
            const response = await fetch('http://localhost:5000/api/chair/assign-reviewer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    pdfId,
                    reviewerId: selectedReviewerId
                })
            });            const data = await response.json();
            if (response.ok) {
                setMessage('Reviewer assigned successfully');
                // Clear the selection for this PDF
                setSelectedPdfReviewers(prev => {
                    const newSelections = { ...prev };
                    delete newSelections[pdfId];
                    return newSelections;
                });
                fetchPDFs();
            } else {
                setMessage(data.message || 'Error assigning reviewer');
            }
        } catch (error) {
            console.error('Error assigning reviewer:', error);
            setMessage('Error assigning reviewer');
        }
    };    const makeDecision = async (pdfId, decision, feedback) => {
        if (!feedback?.trim()) {
            setMessage('Please provide feedback before making a decision');
            return;
        }

        try {
            const response = await fetch('http://localhost:5000/api/chair/make-decision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    pdfId,
                    decision,
                    feedback
                })
            });

            const data = await response.json();            if (response.ok) {
                setMessage('Decision recorded successfully');
                // Clear the feedback for this PDF
                setFeedbackTexts(prev => {
                    const newFeedbacks = { ...prev };
                    delete newFeedbacks[pdfId];
                    return newFeedbacks;
                });
                fetchPDFs();
            } else {
                setMessage(data.message || 'Error recording decision');
            }
        } catch (error) {
            console.error('Error making decision:', error);
            setMessage('Error making decision');
        }
    };    const [userName, setUserName] = useState('');

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(storedUser.name || '');
    }, []);

    return (
        <div className="chair-dashboard">
            <div className="chair-content">
                <div className="dashboard-header">
                    <h1>Chair Dashboard</h1>
                    <p className="welcome-message">Welcome, {userName}!</p>
                </div>
                
                <div className="tab-buttons">
                    <button 
                        className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending PDFs
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'reviewed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reviewed')}
                    >
                        Reviewed PDFs
                    </button>
                </div>

                {message && (
                    <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}

                <div className="pdfs-container">
                    {activeTab === 'pending' ? (
                        <div className="pending-pdfs">
                            <h2>Pending PDFs</h2>
                            {pendingPDFs.map(pdf => (
                                <div key={pdf.pdfId} className="pdf-card">
                                    <div className="pdf-info">
                                        <h3>{pdf.pdfName}</h3>
                                        <p>Author: {pdf.pdfAuthor}</p>
                                        <p>Uploaded: {new Date(pdf.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="assign-section">                            <select 
                                className="reviewer-select"
                                value={selectedPdfReviewers[pdf.pdfId] || ''}
                                onChange={(e) => setSelectedPdfReviewers({
                                    ...selectedPdfReviewers,
                                    [pdf.pdfId]: e.target.value
                                })}
                            >
                                <option value="">Select Reviewer</option>
                                {reviewers && reviewers.map(reviewer => (
                                    <option key={reviewer._id} value={reviewer._id}>
                                        {reviewer.name} ({reviewer.email})
                                    </option>
                                ))}
                            </select>
                            <button 
                                onClick={() => assignReviewer(pdf.pdfId)}
                                disabled={!selectedPdfReviewers[pdf.pdfId]}
                                className="assign-button"
                            >
                                Assign Reviewer
                            </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="reviewed-pdfs">
                            <h2>Reviewed PDFs</h2>
                            {reviewedPDFs.map(pdf => (
                                <div key={pdf.pdfId} className="pdf-card">
                                    <div className="pdf-info">
                                        <h3>{pdf.pdfName}</h3>
                                        <p>Author: {pdf.pdfAuthor}</p>
                                        <p>Reviewer: {pdf.reviewerName}</p>
                                        <p>Grade: {pdf.grade}/10</p>
                                    </div>
                                    <div className="decision-section">                                        <textarea 
                                            placeholder="Add feedback for the author..."
                                            className="feedback-input"
                                            value={feedbackTexts[pdf.pdfId] || ''}
                                            onChange={(e) => setFeedbackTexts({
                                                ...feedbackTexts,
                                                [pdf.pdfId]: e.target.value
                                            })}
                                        />
                                        <div className="decision-buttons">
                                            <button 
                                                className="accept-button"
                                                onClick={() => makeDecision(pdf.pdfId, 'accepted', feedbackTexts[pdf.pdfId])}
                                            >
                                                Accept
                                            </button>
                                            <button 
                                                className="reject-button"
                                                onClick={() => makeDecision(pdf.pdfId, 'rejected', feedbackTexts[pdf.pdfId])}
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChairPage;
