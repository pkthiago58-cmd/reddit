# Guia de Configuração do Prisma e Google Auth

## Problema Atual
O erro `@prisma/client did not initialize yet` acontece porque o Prisma Client precisa ser gerado antes de usar a autenticação.

## Passos para Resolver

### 1. Gerar o Prisma Client
Abra o terminal **na pasta do projeto** (`c:\Users\Usuario\meu-reddit`) e execute:

```bash
npx prisma generate
```

Se der erro, tente:
```bash
npm install @prisma/client prisma --save
npx prisma generate
```

### 2. Criar o Banco de Dados
Ainda no terminal, execute:

```bash
npx prisma db push
```

Isso vai criar o arquivo `dev.db` na pasta `prisma/`.

### 3. Configurar as Credenciais do Google (IMPORTANTE!)

Você precisa configurar o Google OAuth para o login funcionar:

#### 3.1. Criar Credenciais no Google Cloud Console
1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure:
   - **Application type**: Web application
   - **Name**: Meu Reddit
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/api/auth/callback/google`

6. Copie o **Client ID** e **Client Secret**

#### 3.2. Configurar o arquivo .env
Abra o arquivo `.env` na raiz do projeto e preencha:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="cole-aqui-um-segredo-aleatorio-longo"
AUTH_GOOGLE_ID="cole-aqui-o-client-id-do-google"
AUTH_GOOGLE_SECRET="cole-aqui-o-client-secret-do-google"
```

**Para gerar o AUTH_SECRET**, execute:
```bash
npx auth secret
```

### 4. Reiniciar o Servidor
Depois de configurar tudo:

```bash
npm run dev
```

## Verificação

Se tudo estiver correto:
- ✅ O servidor deve iniciar sem erros
- ✅ Você conseguirá fazer login com Google
- ✅ O banco de dados `dev.db` será criado em `prisma/dev.db`

## Problemas Comuns

### "prisma generate" falha
- Certifique-se de estar na pasta correta: `cd c:\Users\Usuario\meu-reddit`
- Reinstale as dependências: `npm install`

### Login do Google não funciona
- Verifique se o `.env` tem as credenciais corretas
- Confirme que a URL de callback no Google Cloud Console está correta
- Reinicie o servidor após alterar o `.env`

### Banco de dados não é criado
- Execute `npx prisma db push` novamente
- Verifique se a pasta `prisma/` existe
