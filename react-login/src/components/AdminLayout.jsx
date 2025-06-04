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
        backgroundColor: '#f8fafc'
      }}>
        {children}
      </div>
    </>
  );
};

export default AdminLayout;