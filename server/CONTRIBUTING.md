# Contributing & repo reorganization notes

1. How to move files and preserve history
   - Use `git mv oldpath newpath` to move files to the new layout.
   - If you need to create new folders: `mkdir -p src/ChineseSaleApi.Application`

2. Recommended move commands (adjust to your actual file list)
   - See the `repo-move.sh` commands below.

3. After moves
   - Open __Git Changes__ to verify staged changes.
   - Run __Build.BuildSolution__ in Visual Studio to fix namespaces and references.
   - Run unit and integration tests.

4. Commit message
   - Use a clear message: "chore: reorganize project to Clean Architecture layout"