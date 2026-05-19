FROM python:3.13-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
  PYTHONDONTWRITEBYTECODE=1 \
  PYTHONHASHSEED=random \
  PIP_NO_CACHE_DIR=1 \
  PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install system dependencies with minimal packages
RUN apt-get update \
  && apt-get upgrade -y \
  && apt-get install -y --no-install-recommends \
  gcc \
  libpq-dev \
  libffi-dev \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get clean

# Create non-root user early
RUN groupadd --system --gid 1001 app \
  && useradd --system --gid app --uid 1001 --home /app --create-home app

# Copy and install Python dependencies
COPY --chown=app:app requirements.txt ./
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy application code
COPY --chown=app:app . /app/

# Copy and setup entrypoint
COPY --chown=app:app entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

USER app
EXPOSE 8000
ENTRYPOINT ["/app/entrypoint.sh"]
