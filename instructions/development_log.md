# Development Log: Repomap Analyzer

This file tracks the progress of the Repomap Analyzer project, serving as a context window of what has been accomplished so far and what is currently planned.

## Completed Work

### 1. Backend Foundation
- **Architecture Setup**: Configured the base FastAPI architecture (`backend/app/main.py`).
- **Database configuration**: Set up an SQLite database via `SQLModel` (`backend/app/core/database.py`).
- **Data Models**: Created the `FileSummaryCache` model (`backend/app/models/cache.py`) to store file hashes, LLM-generated summaries, Lines of Code (LoC), and creation timestamps.
- **Dependencies**: Installed core packages (`fastapi`, `uvicorn`, `sqlmodel`, `pydantic-settings`).

### 2. File System Crawler Service
- **Implementation**: Created an asynchronous directory crawler (`backend/app/services/crawler.py`).
- **Features**: 
  - Recursively traverses local directories.
  - Hard-coded to ignore standard binary/build folders (`.git`, `node_modules`, `venv`, `.venv`, `__pycache__`, `build`, `dist`).
  - Actively checks for and ignores OS-level symlinks to prevent infinite recursive loops.
- **Testing**: Added `pytest` and `pytest-asyncio`. Created robust tests (`backend/tests/test_crawler.py`) mocking a file system environment with ignored folders and symlinks.

### 3. Dependency Parser Engine
- **Architecture**: Created a parser module (`backend/app/services/parsers/`) utilizing a Factory design pattern.
- **Base Interface**: Created `BaseParser` with an abstract `extract_dependencies` method.
- **Python Parser**: Implemented using the native `ast` module to accurately pull all imported modules. Includes syntax error handling.
- **JS/TS Parser**: Implemented using regex to extract ES6 (`import`) and CommonJS (`require`) module dependencies.
- **Testing**: Wrote full unit tests (`backend/tests/test_parsers.py`) ensuring accurate AST tracking and regex matching.

### 4. AI & Hash-Based Cache Service
- **Implementation**: Created the AI integration service (`backend/app/services/ai_service.py`) via `litellm`.
- **Logic**:
  - Calculates a SHA-256 hash of a file's content.
  - Queries the database for a cache hit to prevent redundant API calls.
  - If a cache miss occurs, the LLM is prompted to explain the file in exactly 3 simple sentences.
  - Successfully fetched summaries are cached into the SQLite database.
  - Handled timeouts and errors gracefully to avoid poisoning the cache with failed responses.
- **Testing**: Created unit tests (`backend/tests/test_ai_service.py`) leveraging `AsyncMock` to test cache hit, cache miss, and API failure scenarios without making real network calls.

## Current Status
- The backend services (crawler, parser, AI caching layer) have been individually built and unit-tested successfully. 
- **Orchestration / Endpoints**: Connected the crawler, dependency parsers, and AI caching service into unified FastAPI endpoints (`/api/scan` and `/api/summary`) that construct the final repository map graph.
- **Frontend Core**: Initialized a React + Vite + TypeScript frontend. Integrated React Flow for visualizing the graph and Zustand for state management. Connected to backend APIs.
- **Advanced Graph Engine**: Replaced the default React Flow layout with **ELK.js**, applying a dense, highly compact layout structure with constrained orthogonal (`smoothstep`) edge routing.
- **Folder Supernodes**: Implemented expandable/collapsible folder nodes. Folders start collapsed by default for a clean high-level view, dynamically grouping children nodes when closed.
- **Semantic UI**: Developed highly compact file node chips with semantic color coding (Purple for tests, Orange for configs, Green for entry points, Gray for defaults).
- **Navigation & Layout**: 
  - Restructured the app to use a dedicated top Header Bar so controls never obscure the architecture graph.
  - Implemented a targeted "Search File" function that flies the camera to the matching node and zooms in.
  - Added a collapsible slide-out Sidebar for the AI Inspector.
- **Project Management Rule Established**: We will update this `development_log.md` file during every prompt interaction to maintain a perfect context window.

## Next Steps
- **Performance Optimizations**: Address rendering bottlenecks if the repository is extremely large (e.g., thousands of nodes).
- **Exporting/Saving**: Allow users to save their analyzed graph structures locally.
