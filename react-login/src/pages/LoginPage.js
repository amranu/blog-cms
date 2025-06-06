// You need to save this in react-login/src/pages/LoginPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import AdSense from 'react-adsense';
import { API_ENDPOINTS } from '../config/constants';

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    const userItem = JSON.parse(localStorage.getItem('user'));
    if (userItem) {
      const currentTime = new Date().getTime();
      if (currentTime < userItem.expiry) {
        navigate('/');
      } else {
        // Session expired, remove user data from local storage
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);

  const login = async (event) => {
    event.preventDefault();

    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'username': username,
        'password': password
      })
    });

    const data = await response.json();

    if (data.login) {
      // Save user session data and token in local storage with expiry time
      const expiryTime = new Date().getTime() + 30 * 24 * 60 * 60 * 1000; // 30 days from now
      localStorage.setItem('user', JSON.stringify({ data: data.user, expiry: expiryTime }));
      localStorage.setItem('token', data.token); // Store JWT token
      navigate('/');
    } else {
      // Handle login error. You might want to set some error state here
      console.error('Login failed:', data.error);
    }
  };

return (
  <>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7538974932414936" crossorigin="anonymous"></script>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f0f0f0' }}>
      <h1 style={{ marginBottom: '50px' }}>Isodigm Data Analytics</h1>
      <LoginForm 
        login={login}
        username={username}
        setUsername={setUsername}
        password={password}
        setPassword={setPassword}
      />
      <AdSense.Google
        client='ca-pub-7538974932414936'
        slot='7806394673'
        style={{ display: 'block' }}
        format='auto'
        responsive='true'
      />
      <AdSense.Google
        client='ca-pub-7292810486004926'
        slot='7806394673'
        style={{ display: 'block' }}
        format='auto'
        responsive='true'
      />
    </div>
  </>
);

}

export default LoginPage;
