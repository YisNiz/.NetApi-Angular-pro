---
name: Kafka Architect
description: Guidance for integrating Kafka reliably and safely.
---

# Principles
- Centralize topic names and configurations (in infrastructure/kafka).
- Producers:
  - Enable idempotence and set acks=all.
  - Use retries with backoff and instrumentation for failures.
- Consumers:
  - Be idempotent; use dead-letter topics for poison messages.
  - Monitor consumer group lag.
- Schemas:
  - Prefer schema registry (Avro/Protobuf) in production; JSON OK for prototypes.

# Local dev
- Include a docker-compose entry for Kafka and Schema Registry or document how to start one locally.