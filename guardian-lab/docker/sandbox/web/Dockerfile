FROM kasmweb/chrome:1.18.0@sha256:ae3d50d888a35e745c699941d4f51bee0710bf655a53a0889d1da447382effc1
USER root
RUN apt-get update && apt-get install -y --no-install-recommends python3-watchdog && rm -rf /var/lib/apt/lists/*
COPY docker/sandbox/web/quarantine.py /guardian-quarantine.py
COPY docker/sandbox/web/read-quarantine.py /guardian-read-file.py
COPY docker/sandbox/web/entrypoint.sh /guardian-entrypoint.sh
COPY docker/sandbox/web/policies.json /etc/opt/chrome/policies/managed/guardian.json
COPY docker/sandbox/web/kasmvnc.yaml /etc/kasmvnc/kasmvnc.yaml
RUN chmod 755 /guardian-entrypoint.sh
USER 1000
ENTRYPOINT ["/guardian-entrypoint.sh"]
