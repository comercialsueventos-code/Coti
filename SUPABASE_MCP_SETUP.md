# Configuración MCP Supabase

## Archivos creados:
- `.cursor/mcp.json` - Configuración para Cursor IDE
- `.vscode/mcp.json` - Configuración para VS Code

## Pasos para configurar:

### 1. Obtener Project Reference
- Ve a tu dashboard de Supabase
- El project-ref está en la URL: `https://supabase.com/dashboard/project/[PROJECT_REF]`

### 2. Crear Personal Access Token
- Ve a https://supabase.com/dashboard/account/tokens
- Crea un nuevo token con un nombre descriptivo
- Copia el token generado

### 3. Configurar archivos
Reemplaza en ambos archivos JSON:
- `<TU_PROJECT_REF_AQUI>` con tu project reference
- `<TU_ACCESS_TOKEN_AQUI>` con tu access token

### 4. Características de seguridad
- **read-only**: Configurado para solo lectura (más seguro)
- **project-scoped**: Limitado a un proyecto específico

### 5. Para usar sin read-only (desarrollo):
Quita `"--read-only",` de los args si necesitas escritura.

## Comando CLI directo:
```bash
npx -y @supabase/mcp-server-supabase@latest --read-only --project-ref=TU_PROJECT_REF
```