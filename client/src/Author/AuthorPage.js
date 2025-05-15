import React, { useState, useEffect } from 'react';
import './AuthorStyles.css';

const AuthorPage = () => {
    const [pdfFile, setPdfFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [uploadStatus, setUploadStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [pdfs, setPdfs] = useState([]);

    // Fetch author's PDFs on component mount
    useEffect(() => {
        const fetchPDFs = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/author/pdfs', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setPdfs(data);
                }
            } catch (error) {
                console.error('Error fetching PDFs:', error);
            }
        };
        fetchPDFs();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setPdfFile(file);
            setFileName(file.name);
            setUploadStatus('');
        } else {
            setUploadStatus('Please select a valid PDF file');
            setPdfFile(null);
            setFileName('');
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!pdfFile) {
            setUploadStatus('Please select a PDF file first');
            return;
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append('pdfFile', pdfFile);
        formData.append('pdfName', fileName);
        
        try {            // Get user role from localStorage
            const userRole = localStorage.getItem('userRole');
            const token = localStorage.getItem('token');
            
            const response = await fetch('http://localhost:5000/api/upload-pdf', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (response.ok) {
                setUploadStatus('PDF uploaded successfully!');
                setPdfFile(null);
                setFileName('');
            } else {
                setUploadStatus(`Upload failed: ${data.message}`);
            }
        } catch (error) {
            setUploadStatus('Error uploading PDF. Please try again.');
            console.error('Upload error:', error);
        } finally {
            setIsLoading(false);
        }
    };    const [userName, setUserName] = useState('');

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUserName(storedUser.name || '');
    }, []);

    return (
        <div className="author-container">
            <div className="author-content">
                <div className="dashboard-header">
                    <h1>Author Dashboard</h1>
                    <p className="welcome-message">Welcome, {userName}!</p>
                </div>
                <div className="upload-section">
                    <h2>Upload PDF</h2>
                    <form onSubmit={handleUpload} className="upload-form">
                        <div className="file-input-container">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                id="pdf-upload"
                                className="file-input"
                            />
                            <label htmlFor="pdf-upload" className="file-label">
                                Choose PDF File
                            </label>
                            {fileName && <span className="file-name">{fileName}</span>}
                        </div>
                        <button 
                            type="submit" 
                            className="upload-button"
                            disabled={!pdfFile || isLoading}
                        >
                            {isLoading ? 'Uploading...' : 'Upload PDF'}
                        </button>
                    </form>
                    {uploadStatus && (
                        <div className={`status-message ${uploadStatus.includes('successfully') ? 'success' : 'error'}`}>
                            {uploadStatus}
                        </div>
                    )}                </div>
                
                <div className="pdf-list-section">
                    <h2>Your Uploaded PDFs</h2>
                    {pdfs.length > 0 ? (
                        <div className="pdf-list">
                            {pdfs.map((pdf) => (
                                <div key={pdf.pdfId} className="pdf-item">
                                    <span className="pdf-name">{pdf.pdfName}</span>
                                    <span className="pdf-date">
                                        {new Date(pdf.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-pdfs">No PDFs uploaded yet</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthorPage;
