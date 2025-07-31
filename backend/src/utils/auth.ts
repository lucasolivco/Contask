// Ferramentas para trabalhar com senhas e autenticação
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Função para "embaralhar" a senha (criptografar)
export const hashPassword = async (password: string): Promise<string> => {
  // É TRASNFORMAR "123456" em algo como "a1b2c3d4e5f6g7h8i9j0"
  // Usamos bcrypt para isso, que é uma biblioteca de segurança
  const saltRounds = 10; // Número de "voltas" para embaralhar a senha
  return await bcrypt.hash(password, saltRounds);
}

// Função para verificar se a senha digitada é igual à senha "embaralhada"
export const comparePassword = async (
    password: string,
    hashedPassword: string
    ): Promise<boolean> => {
       // Compara as duas senhas e retorna true se forem iguais
       return await bcrypt.compare(password, hashedPassword);
}

// Função para criar um "token" (como um ingresso de cinema)
export const generateToken = (userId: string): string => {
  // Cria um código especial que prova que o usuário fez login
  // Esse código expira em 7 dias (como definido no .env)
  const expiresIn = '7d'
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn }
  )
}

// Função para verificar se um token é válido
export const verifyToken = (token: string): any => {
  try {
    // Tenta "ler" o token usando nossa chave secreta
    return jwt.verify(token, process.env.JWT_SECRET!)
  } catch (error) {
    // Se der erro, o token é inválido
    return null
  }
}

