FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends squid ca-certificates && rm -rf /var/lib/apt/lists/*
COPY docker/sandbox/egress/squid.conf /etc/squid/squid.conf
COPY docker/sandbox/egress/entrypoint.sh /guardian-egress.sh
RUN chmod 755 /guardian-egress.sh
ENTRYPOINT ["/guardian-egress.sh"]
