import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './loginboxcss.css';

// Create axios instance with base URL
const api = axios.create({
    baseURL: 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json'
    }
});

export default function Loginbox() {
    const navigate = useNavigate();
    const [isSignUp, setIsSignUp] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        
        try {
            const endpoint = isSignUp ? '/api/signup' : '/api/login';
            const response = await api.post(endpoint, formData);
            const data = response.data;
            
            if (response.status >= 400) {
                throw new Error(data.message || 'Something went wrong');
            }            if (isSignUp) {
                setMessage('Registration successful! Please wait for admin approval.');
                // Clear the form after successful signup
                setFormData({
                    name: '',
                    email: '',
                    password: ''
                });
            } else {                // Store the token and user info
                localStorage.setItem('token', data.token);
                localStorage.setItem('userRole', data.user.role);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                // Redirect based on user role
                if (data.user.role === 'admin') {
                    navigate('/admin');
                } else if (data.user.role === 'author') {
                    navigate('/author');
                } else if (data.user.role === 'reviewer') {
                    navigate('/reviewer');
                } else if (data.user.role === 'chair') {
                    navigate('/chair');
                }
                // Store user data and redirect based on role
                localStorage.setItem('user', JSON.stringify(data.user));
                const { role } = data.user;
                navigate(`/${role.toLowerCase()}`);
            }
        } catch (error) {
            setError(error.message);
            console.error('Error:', error);
        }
    };

    return (
        <div className="wrapper">
            <div className="card-switch">
                <label className="switch">
                    <input
                        type="checkbox"
                        className="toggle"
                        checked={isSignUp}
                        onChange={() => {
                            setIsSignUp(!isSignUp);
                            setError('');
                            setMessage('');
                            setFormData({ name: '', email: '', password: '' });
                        }}
                    />
                    <span className="slider"></span>
                    <span className="card-side"></span>
                    <div className="flip-card__inner">
                        {isSignUp ? (
                            <div className="flip-card__back">
                                <div className="title">Sign up</div>
                                <form className="flip-card__form" onSubmit={handleSubmit}>
                                    <input
                                        className="flip-card__input"
                                        name="name"
                                        placeholder="Name"
                                        type="text"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                    <input
                                        className="flip-card__input"
                                        name="email"
                                        placeholder="Email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    <input
                                        className="flip-card__input"
                                        name="password"
                                        placeholder="Password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button type="submit" className="flip-card__btn">
                                        Sign Up
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="flip-card__front">
                                <div className="title">Log in</div>
                                <form className="flip-card__form" onSubmit={handleSubmit}>
                                    <input
                                        className="flip-card__input"
                                        name="email"
                                        placeholder="Email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    <input
                                        className="flip-card__input"
                                        name="password"
                                        placeholder="Password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button type="submit" className="flip-card__btn">
                                        Log In
                                    </button>
                                </form>
                            </div>
                        )}
                        {error && <div className="error-message">{error}</div>}
                        {message && <div className="success-message">{message}</div>}
                    </div>
                </label>
            </div>
        </div>
    );
}