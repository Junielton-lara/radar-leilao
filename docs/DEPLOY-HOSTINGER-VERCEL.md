# Deploy — Hostinger (Portainer) + Vercel (front)

Guia para publicar **LanceX**:

| Componente | Onde | URL típica |
|------------|------|------------|
| PostgreSQL + Redis + API | VPS Hostinger + **Portainer** | `https://api.seudominio.com` |
| Front React | **Vercel** | `https://radar-leilao.vercel.app` |

---

## 1. Pré-requisitos

- VPS Hostinger com **Docker** e **Portainer** instalados
- Repositório: [github.com/Junielton-lara/radar-leilao](https://github.com/Junielton-lara/radar-leilao)
- Conta **Vercel** ligada ao GitHub
- Domínio (opcional): `api.` para a API e apex/www para o front

---

## 2. API + banco no Portainer (Hostinger)

### 2.1 Clonar o projeto no servidor

```bash
cd /opt
git clone https://github.com/Junielton-lara/radar-leilao.git
cd radar-leilao
```

### 2.2 Variáveis de ambiente

Copie o exemplo e edite:

```bash
cp docker/.env.portainer.example docker/.env.portainer
# edite senhas, CORS_ORIGIN (URL final da Vercel), JWT, SETTINGS_ENCRYPTION_KEY
```

**Obrigatório:**

- `POSTGRES_PASSWORD` — senha forte do Postgres
- `CORS_ORIGIN` — ex.: `https://radar-leilao.vercel.app` (ou domínio custom + preview: `https://app.com,https://*.vercel.app` **não** funciona com wildcard no Nest; liste URLs exatas separadas por vírgula)
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — mín. 32 caracteres
- `SETTINGS_ENCRYPTION_KEY` — 32 caracteres (integrações Tavily/IA no admin)

### 2.3 Criar stack no Portainer (Git — recomendado)

Na tela **Create stack** (como você está agora):

| Campo | Valor |
|--------|--------|
| **Name** | `app-radar` (ou `lancex`) |
| **Build method** | Git repository |
| **Repository URL** | `https://github.com/Junielton-lara/radar-leilao` |
| **Repository reference** | `refs/heads/main` |
| **Compose path** | `docker-compose.yml` |
| **Authentication** | seu usuário GitHub + PAT (repo read) |

O repositório inclui `stack.env` com placeholders. **Antes do deploy**, em **Environment variables** → **Advanced mode**, sobrescreva pelo menos:

- `POSTGRES_PASSWORD`
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (32+ caracteres cada)
- `SETTINGS_ENCRYPTION_KEY` (32 caracteres)
- `CORS_ORIGIN` = URL exata do front na Vercel (sem `/` no final)

Depois: **Deploy the stack**. A primeira vez **builda a imagem** (5–15 min).

Alternativa: **Web editor** + conteúdo de `docker/docker-compose.portainer.yml` ou `docker-compose.yml` na raiz.

**GitOps updates**: pode deixar desligado na primeira subida.

A primeira subida **compila a imagem da API** (pode levar alguns minutos).

- Postgres e Redis ficam na rede interna `lancex`
- API publicada na porta host `API_PUBLISH_PORT` (padrão **3001**)

### 2.4 Seed do admin (primeira vez)

Com a stack no ar, rode **uma vez** no host (ou container one-off):

```bash
cd /opt/radar-leilao/apps/api
export DATABASE_URL="postgresql://lancex:SUA_SENHA@127.0.0.1:5432/lancex?schema=public"
npm ci --legacy-peer-deps
npx prisma migrate deploy
npm run prisma:seed -w @lancex/api
```

Ou defina `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` temporariamente e use `docker compose run` com o serviço api (requer Node no host ou imagem auxiliar).

Credenciais padrão do seed local: `admin@lancex.app` / `ChangeMeAdmin123!` — **troque em produção**.

### 2.5 Reverse proxy (HTTPS) na Hostinger

Exponha a API com **Nginx** ou **Traefik** apontando para `http://127.0.0.1:3001`:

```nginx
server {
    listen 443 ssl http2;
    server_name api.seudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Teste:

```bash
curl https://api.seudominio.com/api/v1/health
```

Deve retornar `"database":"up"`.

Swagger: `https://api.seudominio.com/api/docs`

---

## 3. Front na Vercel

### 3.1 Importar projeto

1. [vercel.com](https://vercel.com) → **Add New Project** → repo `radar-leilao`
2. **Root Directory**: raiz do monorepo (`.`)

O `vercel.json` na raiz já define:

- `installCommand`: `npm install --legacy-peer-deps`
- `buildCommand`: `npm run vercel-build`
- `outputDirectory`: `apps/web/dist`
- SPA rewrites para React Router

### 3.2 Variáveis na Vercel

| Nome | Valor |
|------|--------|
| `VITE_API_URL` | `https://api.seudominio.com/api/v1` |

**Production** e **Preview**: use a mesma API ou uma API de staging.

### 3.3 Deploy

Após o deploy, confirme login e mapa. Se der erro de CORS, ajuste `CORS_ORIGIN` na stack Portainer com a URL **exata** da Vercel e redeploy/restart da API.

---

## 4. Atualizações

**API (Portainer):**

```bash
cd /opt/radar-leilao && git pull
```

No Portainer: stack → **Update** → **Pull and redeploy** (rebuild da imagem `api`).

**Front:** push na `main` → Vercel redeploy automático.

---

## 5. Checklist produção

- [ ] `.env` local **não** commitado; secrets só no Portainer/Vercel
- [ ] `CORS_ORIGIN` = URL(s) do front
- [ ] `VITE_API_URL` = URL pública da API + `/api/v1`
- [ ] HTTPS na API e no front
- [ ] Senha admin alterada após seed
- [ ] Tavily/IA configurados em **Admin → Integrações** (ou env `TAVILY_API_KEY` / `AI_API_KEY`)
- [ ] Backup do volume `lancex_pgdata` (Portainer → Volumes)

---

## 6. Troubleshooting

| Sintoma | Ação |
|---------|------|
| API não sobe | Logs do container `api` — falha de migration ou `DATABASE_URL` |
| `database: down` no health | Postgres ainda iniciando ou senha/host errados |
| CORS no browser | Conferir `CORS_ORIGIN` e reiniciar API |
| Mapa vazio | Coleta + pins UF; filtros de categoria no radar |
| Build Vercel falha | Ver log; rodar `npm run vercel-build` local |
| Redeploy Portainer: `pull access denied for lancex-api` | Imagem é **local** (build no VPS). No compose do serviço `api`, use `pull_policy: build`. No Portainer: **Update the stack** com opção de **rebuild** da imagem, não só “pull images”. |

---

## Arquivos de referência

- `docker/Dockerfile.api` — imagem NestJS + Prisma migrate no start
- `docker/docker-compose.portainer.yml` — stack Postgres + Redis + API
- `docker/.env.portainer.example` — template de env
- `vercel.json` — build do front
