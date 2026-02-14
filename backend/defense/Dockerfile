FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Common Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Shared Code
COPY shared /app/shared

# Copy Service Code
COPY defense /app/defense

# Run the application
CMD ["uvicorn", "defense.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
