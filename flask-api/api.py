#!/usr/bin/python
"""
Modular Flask API Application
"""
from __init__ import create_app, db

app = create_app()

if __name__ == '__main__':
    app.run(debug=True, passthrough_errors=True)