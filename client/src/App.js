import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Loginbox from './Loginbox';
import AdminPage from './Admin/AdminPage';
import AuthorPage from './Author/AuthorPage';
import ChairPage from './Chair/ChairPage';
import ReviewerPage from './Reviewer/ReviewerPage';
import './App.css';

export default function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Loginbox />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/author" element={<AuthorPage />} />
          <Route path="/reviewer" element={<ReviewerPage />} />
          <Route path="/chair" element={<ChairPage />} />
        </Routes>
      </div>
    </Router>
  );
}