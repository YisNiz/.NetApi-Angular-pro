#!/usr/bin/env bash
set -e
shopt -s globstar nullglob

# restore packages and build
dotnet restore || true

# build solution (will show any broken references)
if ls *.sln >/dev/null 2>&1; then
  SLN_FILE="$(ls *.sln | head -n1)"
  dotnet build "$SLN_FILE" -v minimal || true
else
  # build any csproj under src
  for p in src/**/*.csproj; do
    dotnet build "$p" -v minimal || true
  done
fi

echo "Restore and build finished. Open Visual Studio and run __Build.BuildSolution__ to inspect and fix remaining issues."