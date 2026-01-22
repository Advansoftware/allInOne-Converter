FROM python:3.11-slim

LABEL Maintainer="AllOne Converter"

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  ffmpeg \
  curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY app/ /app/src/

# Create storage directory
RUN mkdir -p /app/storage

EXPOSE 8000

# Start the application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
