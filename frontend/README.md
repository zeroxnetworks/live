# Frontend

The production frontend currently lives in the repository `src/` tree so the existing Vite entry point and import graph remain stable.

This directory documents the architectural boundary: browser/UI code belongs to `src/`; server-only code belongs to `server/`.

A physical directory move should only be performed with a full import/build migration because the current application is a single Vite + Express deployment and contains many existing relative imports.
