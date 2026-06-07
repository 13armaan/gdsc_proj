# Project Overview: Repomap Analyzer

## The Goal
A local static analysis engine that parses Git repositories to visually map folder structures, inter-file dependencies, and calculate Lines of Code (LoC). 

## Core Stack
- **Backend:** Python 3.11+, FastAPI, SQLite (via SQLModel)
- **Frontend:** React 18 (Vite, TypeScript), React Flow, Zustand
- **AI Integration:** Local caching of AI-generated file summaries (via litellm).

## Strict AI Agent Rules
1. Never execute the target repository code; this is static analysis only.
2. Read all files in the `instructions/` folder before generating major architecture.
3. Keep frontend and backend domains strictly isolated.
4. Always implement robust error handling for OS-level file reading.