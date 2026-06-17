---
name: Docker Architect
description: Guidance for containerizing the .NET 8 API and local orchestration.
---

# Goal
Make reproducible images and a local compose environment that mirror production dependencies.

# Best practices
- Multi-stage Dockerfile:
  - Build: mcr.microsoft.com/dotnet/sdk:8.0
  - Runtime: mcr.microsoft.com/dotnet/aspnet:8.0
- Use __.dockerignore__ (bin/, obj/, .git/, node_modules/, *.md).
- Add HEALTHCHECK that calls /health or /ready.
- Avoid embedding secrets in images; use environment variables or Docker secrets.

# Local dev compose
- Provide services: api, sqlserver, redis, zookeeper/kafka (Confluent).
- Document exposed ports and how to run DB migrations on startup.
- Example checks:
  - docker build --file infrastructure/docker/ChineseSaleApi.Dockerfile -t chinesesaleapi:local .
  - docker-compose -f infrastructure/docker/docker-compose.yml up --build