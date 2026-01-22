FROM python:3.11-slim

LABEL Maintainer="AllOne Converter"

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  build-essential \
  libboost-system-dev \
  libboost-python-dev \
  libssl-dev \
  curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ /app/src/

# Create directories
RUN mkdir -p /app/storage /app/downloads

# Expose ports
EXPOSE 8000
EXPOSE 6881
EXPOSE 6881/udp

# Start the application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
