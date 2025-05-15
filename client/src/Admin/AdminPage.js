import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Adminlist from './Adminlist';
import './AdminDashboard.css';

const api = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json'
    }
});

export default function AdminPage() {
    const navigate = useNavigate();
    const [adminName, setAdminName] = useState('');

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = JSON.parse(localStorage.getItem('user'));
                if (!user || user.role !== 'admin') {
                    navigate('/');
                    return;
                }
                setAdminName(user.name);
            } catch (error) {
                navigate('/');
            }
        };

        checkAuth();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };    return (
        <div className="admin-dashboard">
            <header className="admin-header">
                <h1>Admin Dashboard</h1>
                <div className="admin-info">
                    <span>Welcome, {adminName}</span>
                    <button onClick={handleLogout} className="logout-btn">Logout</button>
                </div>
            </header>
            <div className="admin-content">
                <Adminlist />
            </div>
        </div>
    );
}