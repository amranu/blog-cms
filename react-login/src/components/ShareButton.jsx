import React, { useState, useEffect, useRef } from 'react';

const ShareButton = ({ post }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const postUrl = `${window.location.origin}/${post.slug}`;
  const postTitle = post.title;
  const postExcerpt = post.excerpt || post.content.substring(0, 150) + '...';

  const shareOptions = [
    {
      name: 'Twitter',
      icon: '🐦',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(postTitle)}&url=${encodeURIComponent(postUrl)}`,
      color: '#1DA1F2'
    },
    {
      name: 'Facebook',
      icon: '📘',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
      color: '#4267B2'
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
      color: '#0077B5'
    },
    {
      name: 'Reddit',
      icon: '🔴',
      url: `https://reddit.com/submit?url=${encodeURIComponent(postUrl)}&title=${encodeURIComponent(postTitle)}`,
      color: '#FF4500'
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      url: `https://wa.me/?text=${encodeURIComponent(postTitle + ' ' + postUrl)}`,
      color: '#25D366'
    },
    {
      name: 'Email',
      icon: '📧',
      url: `mailto:?subject=${encodeURIComponent(postTitle)}&body=${encodeURIComponent(postExcerpt + '\n\nRead more: ' + postUrl)}`,
      color: '#666666'
    }
  ];

  const handleShare = (shareUrl) => {
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setShowDropdown(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      alert('Link copied to clipboard!');
      setShowDropdown(false);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = postUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
      setShowDropdown(false);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: '500',
          color: 'var(--blog-text-secondary)',
          backgroundColor: 'transparent',
          border: '1px solid var(--blog-border-primary)',
          borderRadius: '20px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'var(--blog-bg-secondary)';
          e.target.style.color = 'var(--blog-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = 'var(--blog-text-secondary)';
        }}
      >
        <span style={{ fontSize: '14px' }}>📤</span>
        <span>Share</span>
        <span style={{ 
          fontSize: '10px', 
          transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          marginTop: '8px',
          minWidth: '180px',
          backgroundColor: 'var(--blog-bg-primary)',
          border: '1px solid var(--blog-border-primary)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {shareOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleShare(option.url)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--blog-text-primary)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--blog-bg-secondary)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ fontSize: '16px' }}>{option.icon}</span>
              <span>{option.name}</span>
            </button>
          ))}
          
          {/* Copy Link Option */}
          <button
            onClick={copyToClipboard}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--blog-text-primary)',
              backgroundColor: 'transparent',
              border: 'none',
              borderTop: '1px solid var(--blog-border-primary)',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--blog-bg-secondary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <span style={{ fontSize: '16px' }}>🔗</span>
            <span>Copy Link</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareButton;