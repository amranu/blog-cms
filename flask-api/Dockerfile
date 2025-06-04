FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn

COPY . .

# Ensure instance directory exists with proper permissions
RUN mkdir -p instance && chmod 755 instance

# Create startup script that handles database initialization
RUN echo '#!/bin/bash' > /start.sh && \
    echo 'if [ ! -f /app/instance/cms_blog.db ]; then' >> /start.sh && \
    echo '  echo "Database not found, initializing..."' >> /start.sh && \
    echo '  python -c "from __init__ import create_app, db; app = create_app(); app.app_context().push(); db.create_all()"' >> /start.sh && \
    echo 'else' >> /start.sh && \
    echo '  echo "Database found, skipping initialization"' >> /start.sh && \
    echo 'fi' >> /start.sh && \
    echo 'exec gunicorn --bind 0.0.0.0:5000 --workers 3 api:app' >> /start.sh && \
    chmod +x /start.sh

# Copy existing database to initialize volume if needed
COPY instance/ ./instance/

EXPOSE 5000

CMD ["/start.sh"]