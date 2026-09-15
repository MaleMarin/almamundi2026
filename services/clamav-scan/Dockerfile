# Cloud Run: ClamAV, minInstances=0, 2Gi, 1 vCPU, timeout 300s, concurrency 1.
# Deploy example:
#   gcloud run deploy almamundi-clamav --source services/clamav-scan \
#     --region us-central1 --min-instances 0 --max-instances 1 \
#     --memory 2Gi --cpu 1 --timeout 300 --concurrency 1 \
#     --set-env-vars MALWARE_SCAN_SECRET=...
FROM python:3.12-slim-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends clamav \
  && freshclam \
  && rm -rf /var/lib/apt/lists/*

COPY main.py /opt/scan/main.py
ENV PORT=8080
EXPOSE 8080
CMD ["python3", "/opt/scan/main.py"]
