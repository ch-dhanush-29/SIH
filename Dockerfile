# MediKiosk Production Container
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (including Tesseract OCR with Indic language data)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-hin \
    tesseract-ocr-tam \
    tesseract-ocr-tel \
    libgl1 \
    && rm -rf /var/lib/apt/lists/*

# Copy project files
COPY . /app

# Install Python requirements
RUN pip install --no-cache-dir fastapi uvicorn pydantic jinja2

EXPOSE 8000

# Run FastAPI production server
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
