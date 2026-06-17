# Project architecture (proposed)

Top-level layout:
- src/
  - ChineseSaleApi/                # API project (Program.cs, Controllers)
  - ChineseSaleApi.Application/    # Services, DTOs, Interfaces
  - ChineseSaleApi.Domain/         # Domain entities, exceptions, value objects
  - ChineseSaleApi.Infrastructure/# EF, Repositories, Kafka, Redis integrations
- tests/
  - ChineseSaleApi.UnitTests/
  - ChineseSaleApi.IntegrationTests/
- infrastructure/
  - docker/                        # Dockerfiles, docker-compose.yml
  - kafka/                         # topic definitions, schema configs
- docs/
- .github/agents/                  # policy / guidance agents
- CONTRIBUTING.md

# Responsibilities
- Keep code in src/ and tests in tests/.
- Keep agents and process docs in .github/agents/.
- Use git mv to preserve history when moving files between folders.

# Quick notes
After moving files run __Build.BuildSolution__ and fix namespaces and project references as needed.