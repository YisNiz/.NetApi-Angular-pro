#!/usr/bin/env bash
set -e

# create new layout
mkdir -p src/ChineseSaleApi src/ChineseSaleApi.Application src/ChineseSaleApi.Domain src/ChineseSaleApi.Infrastructure infrastructure/docker .github/agents docs tests

# Move main API project files (preserve history)
git mv ChineseSaleApi/*.csproj src/ChineseSaleApi/ 2>/dev/null || true
git mv ChineseSaleApi/Program.cs src/ChineseSaleApi/Program.cs 2>/dev/null || true
git mv ChineseSaleApi/Startup.cs src/ChineseSaleApi/Startup.cs 2>/dev/null || true

# Move folders into layers (preserve history)
git mv ChineseSaleApi/Controllers src/ChineseSaleApi/Controllers 2>/dev/null || true
git mv ChineseSaleApi/Dto src/ChineseSaleApi.Application/Dto 2>/dev/null || true
git mv ChineseSaleApi/Services src/ChineseSaleApi.Application/Services 2>/dev/null || true
git mv ChineseSaleApi/Repositories src/ChineseSaleApi.Infrastructure/Repositories 2>/dev/null || true
git mv ChineseSaleApi/Data src/ChineseSaleApi.Infrastructure/Data 2>/dev/null || true
git mv ChineseSaleApi/Models src/ChineseSaleApi.Domain/Models 2>/dev/null || true
git mv ChineseSaleApi/Middleware src/ChineseSaleApi.Infrastructure/Middleware 2>/dev/null || true
git mv ChineseSaleApi/*.config src/ChineseSaleApi/ 2>/dev/null || true

# Move docker/kafka artifacts if present
git mv Dockerfile infrastructure/docker/ChineseSaleApi.Dockerfile 2>/dev/null || true
git mv docker-compose.yml infrastructure/docker/docker-compose.yml 2>/dev/null || true

# Ensure all project files under src are added to the solution (if a .sln exists)
if [ -n "$SLN_FILE" ]; then
  echo "Using solution: $SLN_FILE"
  # remove old references (best-effort)
  for proj in ChineseSaleApi/*.csproj; do
    [ -f "$proj" ] && dotnet sln "$SLN_FILE" remove "$proj" || true
  done

  # add all csproj under src/ to the solution
  for proj in src/**/*.csproj; do
    [ -f "$proj" ] && dotnet sln "$SLN_FILE" add "$proj" || true
  done
fi

git add -A
git commit -m "chore(repo): reorganize to Clean Architecture layout" || true

echo "Moves committed (if there were changes). Next: run './repo-sln-fix.sh' to restore and validate projects."