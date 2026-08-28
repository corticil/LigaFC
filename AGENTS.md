# Reglas del proyecto

## Git

- **Antes de cualquier operación de git (commit, push, merge), preguntar al usuario si está seguro antes de ejecutarla.**
- Commits con Conventional Commits (feat:, fix:, chore:, etc.).
- El usuario es desarrollador único: no hace PRs, se mergea directo a main tras probar en local.
- **La versión se actualiza en el MISMO commit que el cambio, antes de pushear** (un solo deploy por cambio):
  - `fix:`/`perf:` → bump patch (X.Y.Z+1) en `package.json` + `package-lock.json` junto al fix.
  - `feat:` → bump minor (X.Y+1.0) junto al feat.
  - No pushear un cambio y el bump de versión como commits separados: eso genera un doble deploy.
