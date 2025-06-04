import React from 'react';
import PageHeaders from './PageHeaders';

const AdminLayout = ({ children }) => {
  return (
    <>
      <PageHeaders />
      <div className="main-content" style={{
        marginLeft: '250px',
        paddingTop: '85px',
        padding: '85px 30px 30px 30px',
        minHeight: '100vh',
        background: '#0f172a',
        color: '#f1f5f9'
      }}>
        {children}
      </div>
    </>
  );
};

export default AdminLayout;