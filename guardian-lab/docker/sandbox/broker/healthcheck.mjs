try {
  const response = await fetch("http://127.0.0.1:4011/health", {
    headers: { Authorization: `Bearer ${process.env.SANDBOX_BROKER_KEY}` },
    signal: AbortSignal.timeout(4000),
  });
  const health = await response.json();
  process.exit(response.ok && health.web === true ? 0 : 1);
} catch {
  process.exit(1);
}
