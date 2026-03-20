# Kafka local development setup

Optional. Use when you need Kafka for event-driven features (e.g. async jobs, event bus). **The main app does not require Kafka to run.**

---

## Start Kafka stack

From repo root:

```bash
docker compose -f docker-compose.kafka.yml up -d
```

- **Kafka broker:** `127.0.0.1:9092` (from host), `kafka:29092` (from other containers).
- **Kafka UI (optional):** http://localhost:8080 — create topics, inspect messages.

---

## Stop

```bash
docker compose -f docker-compose.kafka.yml down
```

---

## Environment variables (when app uses Kafka)

If you add Kafka clients to the app, use a grouped env section, e.g.:

| Variable | Example | Notes |
|----------|--------|--------|
| `KAFKA_BOOTSTRAP_SERVERS` | `127.0.0.1:9092` | Local; production would use your managed Kafka URL |
| `KAFKA_CLIENT_ID` | `nebula-smile` | Optional |
| `KAFKA_TOPIC_*` | Per-topic names | Define as you add features |

None of these are in `.env.example` by default because Kafka is not required for current app startup.

---

## Creating a topic (CLI)

With the stack running:

```bash
docker compose -f docker-compose.kafka.yml exec kafka \
  kafka-topics --create --topic your-topic --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

Or use Kafka UI at http://localhost:8080.

---

## Summary

- **File:** `docker-compose.kafka.yml`
- **Start:** `docker compose -f docker-compose.kafka.yml up -d`
- **Stop:** `docker compose -f docker-compose.kafka.yml down`
- **Optional:** Not needed for standard app run or CI.
