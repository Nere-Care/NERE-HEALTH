FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends gcc libpq-dev gosu fonts-dejavu-core \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app
RUN groupadd --system app && useradd --system --gid app --home /app app \
  && mkdir -p /app/uploads/documents /app/uploads/profile_docs /app/uploads/photos /app/uploads/pdfs \
  && chown -R app:app /app

# entrypoint : fix volume permissions then drop to app user
COPY --chown=root:root docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["sh", "-c", "python wait_for_db.py && exec gunicorn main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --workers 2"]
