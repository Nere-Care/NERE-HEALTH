FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends gcc libpq-dev \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app
RUN groupadd --system app && useradd --system --gid app --home /app app \
  && chown -R app:app /app

USER app
EXPOSE 8000
CMD ["sh", "-c", "python wait_for_db.py && exec gunicorn main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --workers 2"]
