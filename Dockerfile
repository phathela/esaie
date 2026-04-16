# Simple Python backend only
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Expose port
EXPOSE 8001

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8001
ENV ENVIRONMENT=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8001/health || exit 1

# Start backend server
CMD ["python", "-m", "uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", "8001"]
