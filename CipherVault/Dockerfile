FROM python:3.11-slim

# Set security environment flags
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_ENV=production

# Install system security dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libssl-dev \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create non-root unprivileged security user
RUN groupadd -g 1001 ciphervault && \
    useradd -u 1001 -g ciphervault -s /bin/bash -m ciphervault

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create vault storage directory and set strict permissions
RUN mkdir -p /app/instance/vault_storage && \
    chown -R ciphervault:ciphervault /app && \
    chmod -R 700 /app/instance/vault_storage

USER ciphervault

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--threads", "2", "--timeout", "60", "run:app"]
