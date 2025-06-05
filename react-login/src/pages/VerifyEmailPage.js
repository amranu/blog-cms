import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/constants';

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.VERIFY_EMAIL}?token=${encodeURIComponent(token)}`, {
        method: 'GET',
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully! You can now log in.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Email verification failed. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          marginBottom: '30px',
          color: '#1e293b',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          Email Verification
        </h1>

        {status === 'verifying' && (
          <div>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e2e8f0',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p style={{ color: '#64748b', fontSize: '16px' }}>
              Verifying your email address...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '24px',
                marginBottom: '8px'
              }}>
                ✅
              </div>
              <p style={{ color: '#065f46', margin: 0, fontSize: '16px' }}>
                {message}
              </p>
            </div>
            
            <Link 
              to="/login" 
              style={{
                display: 'inline-block',
                backgroundColor: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '24px',
                marginBottom: '8px'
              }}>
                ❌
              </div>
              <p style={{ color: '#dc2626', margin: 0, fontSize: '16px' }}>
                {message}
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Link 
                to="/register" 
                style={{
                  display: 'inline-block',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Register Again
              </Link>
              
              <Link 
                to="/login" 
                style={{
                  display: 'inline-block',
                  backgroundColor: '#e2e8f0',
                  color: '#1e293b',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default VerifyEmailPage;