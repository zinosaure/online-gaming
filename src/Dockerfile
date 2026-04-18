FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY ./app /app

# Expose port
EXPOSE 80

# Run with hot reload
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80", "--reload"]
