FROM python:3.9-slim

WORKDIR /app

# Install dependencies only
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create the data directory
RUN mkdir -p /data/events

# The source code will be mounted at runtime
CMD ["python", "fetch_data.py"] 