// You need to save this in react-login/src/pages/RegisterPage.js

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Registration is now admin-only, redirect to login
    navigate('/login');
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      backgroundColor: '#f0f0f0' 
    }}>
      <p>Redirecting to login...</p>
    </div>
  );

}

export default RegisterPage;

