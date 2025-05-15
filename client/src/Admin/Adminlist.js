import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json'
    }
});

export default function Adminlist() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        try {
            const response = await api.get('/api/admin/pending-users');
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch users');
            setLoading(false);
        }
    };    const [message, setMessage] = useState('');

    const assignRole = async (userId, role) => {
        try {
            const response = await api.post('/api/admin/assign-role', { userId, role });
            console.log('Role assignment successful:', response.data);
            setMessage(`Successfully assigned ${role} role`);
            
            // Refresh the user list after a brief delay
            setTimeout(() => {
                fetchPendingUsers();
                setMessage(''); // Clear success message after delay
            }, 1000);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to assign role';
            setError(errorMsg);
            console.error('Role assignment error:', err);
            
            // Clear error after 3 seconds
            setTimeout(() => setError(''), 3000);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;    return (
        <div className="admin-container">
            <h2>Pending User Approvals</h2>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            {users.length === 0 ? (
                <p className="no-users">No pending users to approve</p>
            ) : (
                <div className="user-list">
                    {users.map(user => (
                        <div key={user._id} className="user-card">
                            <div className="user-info">
                                <h3>{user.name}</h3>
                                <p>{user.email}</p>
                                <p className="status">Status: {user.status}</p>
                            </div>
                            <div className="role-assignment">
                                <select 
                                    onChange={(e) => assignRole(user._id, e.target.value)}
                                    defaultValue=""
                                    className="role-select"
                                >
                                    <option value="" disabled>Select Role</option>
                                    <option value="author">Author</option>
                                    <option value="reviewer">Reviewer</option>
                                    <option value="chair">Chair</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}