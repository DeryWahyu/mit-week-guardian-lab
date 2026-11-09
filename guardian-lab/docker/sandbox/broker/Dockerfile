FROM node:22-alpine
WORKDIR /broker
COPY docker/sandbox/broker/package*.json ./
RUN npm ci --omit=dev
COPY docker/sandbox/broker/*.mjs ./
EXPOSE 4010 4011
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "healthcheck.mjs"]
CMD ["node", "server.mjs"]
