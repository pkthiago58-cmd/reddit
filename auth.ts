import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import fs from "fs"
import path from "path"
import { getUserStars } from "./lib/reputation"

// Caminho para o arquivo de usuários
const USERS_FILE = path.join(process.cwd(), "data", "users.json");

// Função para garantir que o diretório e arquivo existam
function ensureDataFile() {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]), "utf8");
    }
}

// Função para ler usuários
function getUsers() {
    ensureDataFile();
    const data = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(data);
}

// Função para buscar usuário por email
function getUserByEmail(email: string) {
    const users = getUsers();
    return users.find((u: any) => u.email === email);
}

export const authOptions: NextAuthConfig = {
    providers: [
        Google,
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            authorize: async (credentials) => {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const email = credentials.email as string
                const password = credentials.password as string

                // Buscar usuário no users.json
                const user = getUserByEmail(email)

                if (!user || !user.password) {
                    console.log('[Auth] User not found or no password:', email)
                    return null
                }

                // Verificar senha
                const isPasswordValid = await bcrypt.compare(password, user.password)

                if (!isPasswordValid) {
                    console.log('[Auth] Invalid password for:', email)
                    return null
                }

                // Carregar reputação
                const stars = getUserStars(user.username || "")

                console.log('[Auth] Login successful for:', user.username)

                // Retornar usuário
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name || user.username,
                    username: user.username,
                    image: user.image || null,
                    avatarConfig: user.avatarConfig || null,
                    avatarColor: user.avatarColor || '#008A10',
                    stars,
                    twoFactorEnabled: user.twoFactorEnabled || false,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }: { token: any, user: any, trigger?: string, session?: any }) {
            // Adicionar username e avatarConfig ao token JWT na primeira vez
            if (user) {
                token.username = user.username;
                token.avatarConfig = user.avatarConfig;
                token.avatarColor = user.avatarColor;
                token.stars = user.stars;
                token.twoFactorEnabled = user.twoFactorEnabled;
            }

            // Atualizar token se a sessão for atualizada
            if (trigger === "update" && session) {
                // Handle nested user object (standard) or flat object (custom update calls)
                const data = session.user || session;

                if (data.username) token.username = data.username;
                if (data.avatarConfig) token.avatarConfig = data.avatarConfig;
                if (data.avatarColor) token.avatarColor = data.avatarColor;
                if (data.stars !== undefined) token.stars = data.stars;
                if (data.twoFactorEnabled !== undefined) token.twoFactorEnabled = data.twoFactorEnabled;
            }

            return token;
        },
        async session({ session, token }: { session: any, token: any }) {
            // Adicionar username, avatarConfig e avatarColor à sessão
            if (token.username) {
                session.user.username = token.username;
            }
            if (token.avatarConfig) {
                session.user.avatarConfig = token.avatarConfig;
            }
            if (token.avatarColor) {
                session.user.avatarColor = token.avatarColor;
            }
            if (token.stars !== undefined) {
                session.user.stars = token.stars;
            }
            if (token.twoFactorEnabled !== undefined) {
                session.user.twoFactorEnabled = token.twoFactorEnabled;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)

