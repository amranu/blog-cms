#!/usr/bin/env python3
"""
Quick test script to test the blog post API endpoints
"""

import requests
import json
import sys

# Configuration
API_BASE = 'http://localhost:5000'
TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NDkwNDkwMDcsImlhdCI6MTc0ODk2MjYwN30.x8vInM2DDugGYmheOUmZqHJ4cTAsVf-McgGezEvStp4'

def test_create_post():
    """Test creating a new blog post"""
    print("Testing blog post creation...")
    
    post_data = {
        'title': 'Test Publish API Call',
        'content': 'This is a test post created via API to debug the publish button issue.',
        'status': 'published',
        'excerpt': 'Test excerpt for debugging',
        'category': 'Tech',
        'tags': 'test, debug, api'
    }
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {TOKEN}'
    }
    
    try:
        response = requests.post(
            f'{API_BASE}/api/blog/posts',
            headers=headers,
            json=post_data,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200 or response.status_code == 201:
            result = response.json()
            print("SUCCESS!")
            print(f"Created post ID: {result.get('id')}")
            print(f"Post title: {result.get('title')}")
            print(f"Post status: {result.get('status')}")
            return result.get('id')
        else:
            print("FAILED!")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Raw response: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to API. Make sure Flask server is running on localhost:5000")
    except requests.exceptions.Timeout:
        print("ERROR: Request timed out")
    except Exception as e:
        print(f"ERROR: {e}")
    
    return None

def test_update_post(post_id):
    """Test updating a blog post"""
    print(f"\nTesting blog post update (ID: {post_id})...")
    
    update_data = {
        'title': 'Updated Test Publish API Call',
        'content': 'This is an UPDATED test post to debug the publish button issue.',
        'status': 'published',
        'excerpt': 'Updated test excerpt for debugging',
        'category': 'Tech',
        'tags': 'test, debug, api, updated'
    }
    
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {TOKEN}'
    }
    
    try:
        response = requests.put(
            f'{API_BASE}/api/blog/posts/{post_id}',
            headers=headers,
            json=update_data,
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("UPDATE SUCCESS!")
            print(f"Updated post title: {result.get('title')}")
            print(f"Updated post status: {result.get('status')}")
        else:
            print("UPDATE FAILED!")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Raw response: {response.text}")
                
    except Exception as e:
        print(f"ERROR: {e}")

def cleanup_post(post_id):
    """Clean up test post"""
    if post_id:
        print(f"\nCleaning up test post (ID: {post_id})...")
        headers = {
            'Authorization': f'Bearer {TOKEN}'
        }
        
        try:
            response = requests.delete(
                f'{API_BASE}/api/blog/posts/{post_id}',
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                print("Test post deleted successfully")
            else:
                print(f"Failed to delete test post: {response.status_code}")
        except Exception as e:
            print(f"Error deleting test post: {e}")

if __name__ == '__main__':
    print("Blog Post API Test Script")
    print("=" * 40)
    
    # Test create
    post_id = test_create_post()
    
    # Test update if create was successful
    if post_id:
        test_update_post(post_id)
        
        # Ask if user wants to keep the test post
        if len(sys.argv) > 1 and sys.argv[1] == '--keep':
            print(f"\nKeeping test post with ID: {post_id}")
        else:
            cleanup_post(post_id)
    
    print("\nTest completed!")