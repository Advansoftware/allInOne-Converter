FROM python:3.11-slim-bookworm

LABEL Maintainer="AllOne Converter"

# Install system dependencies including libtorrent
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3-libtorrent \
  curl \
  && rm -rf /var/lib/apt/lists/*

# Create symlink for libtorrent to be available in pip's python
RUN ln -sf /usr/lib/python3/dist-packages/libtorrent*.so /usr/local/lib/python3.11/site-packages/ 2>/dev/null || true

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies (without libtorrent since it's installed via apt)
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
