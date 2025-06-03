import React from 'react';

function FormLayout({ children, link, linkText, extraContent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '100vh', backgroundColor: '#f0f0f0', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '60px' }}>
        {extraContent}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '5px', boxShadow: '0px 0px 10px rgba(0,0,0,0.1)' }}>
          {children}
        </div>
        <a href={link} style={{ marginTop: '20px', fontSize: '12px', color: 'blue', textDecoration: 'none' }}>{linkText}</a>
      </div>
    </div>
  );
}

export default FormLayout;
