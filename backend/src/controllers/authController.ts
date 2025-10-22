// controllers/authController.ts - ADICIONAR RECUPERAÇÃO DE SENHA + VALIDAÇÃO DE NOME
import { Request, Response } from 'express'
import crypto from 'crypto'
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  generateEmailVerificationToken, 
  generatePasswordResetToken,
  getTokenExpirationDate,
  getPasswordResetExpirationDate,
  isTokenExpired,
  validateName
} from '../utils/auth'
import { 
  sendVerificationEmail, 
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail
} from '../services/emailService'
import prisma from '../config/database'

// ✅ REGISTRO COM VERIFICAÇÃO COMPLETA
// ✅ REGISTRO ATUALIZADO COM VALIDAÇÃO DE NOME ÚNICO
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body

        // Validações básicas
        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'Nome, email e senha são obrigatórios'
            })
        }

        // ✅ VALIDAR NOME
        const nameValidation = validateName(name);
        if (!nameValidation.isValid) {
            return res.status(400).json({
                error: nameValidation.error
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Email inválido'
            })
        }

        // ✅ VERIFICAR SE EMAIL JÁ EXISTE
        const existingEmail = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (existingEmail) {
            return res.status(400).json({
                error: 'Email já cadastrado'
            })
        }

        // ✅ VERIFICAR SE NOME JÁ EXISTE (CASE INSENSITIVE)
        const existingName = await prisma.user.findFirst({
            where: { 
                name: {
                    equals: name.trim(),
                    mode: 'insensitive'
                }
            }
        })

        if (existingName) {
            return res.status(400).json({
                error: 'Já existe um usuário com este nome. Escolha um nome diferente.'
            })
        }

        const hashedPassword = await hashPassword(password)
        const emailVerificationToken = generateEmailVerificationToken();
        const tokenExpiresAt = getTokenExpirationDate();

        // Criar usuário
        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.toLowerCase(),
                password: hashedPassword,
                role: role || 'EMPLOYEE',
                emailVerified: false,
                emailVerificationToken,
                tokenExpiresAt
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                emailVerified: true,
                createdAt: true
            }
        })

        // Enviar email
        const emailSent = await sendVerificationEmail(user.email, user.name, emailVerificationToken);

        if (!emailSent) {
            await prisma.user.delete({ where: { id: user.id } });
            return res.status(500).json({
                error: 'Erro ao enviar email de verificação. Tente novamente.'
            });
        }

        res.status(201).json({
            message: 'Usuário cadastrado! Verifique seu email para ativar a conta.',
            user,
            emailSent: true,
            requiresEmailVerification: true
        })

    } catch (error) {
        console.error('Erro ao cadastrar:', error)
        res.status(500).json({
            error: 'Erro interno do servidor'
        })
    }
}

// ✅ LOGIN COMPLETO
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email e senha são obrigatórios'
            })
        }

        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return res.status(401).json({
                error: 'Email ou senha incorretos'
            })
        }

        const isValidPassword = await comparePassword(password, user.password)
        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Email ou senha incorretos'
            })
        }

        // ✅ VERIFICAR EMAIL (AGORA FUNCIONA!)
        if (!user.emailVerified) {
            return res.status(401).json({
                error: 'Email não verificado. Verifique sua caixa de entrada.',
                emailNotVerified: true
            });
        }

        const token = generateToken(user.id)
        const { password: _, emailVerificationToken: __, tokenExpiresAt: ___, ...userSafe } = user;

        res.json({
            message: 'Login realizado com sucesso',
            user: userSafe,
            token
        })

    } catch (error) {
        console.error('Erro no login:', error)
        res.status(500).json({
            error: 'Erro interno do servidor'
        })
    }
}

// ✅ NOVA: ROTA PARA LOGIN DO HUB
export const hubLogin = async (req: Request, res: Response) => {
    const startTime = Date.now();
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            console.warn(`🔐 Hub-login: Tentativa sem credenciais - IP: ${clientIp}`);
            return res.status(400).json({
                autenticado: false,
                mensagem: 'Email e senha são obrigatórios'
            });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            console.warn(`🔐 Hub-login: Usuário não encontrado - Email: ${email}, IP: ${clientIp}`);
            return res.status(401).json({
                autenticado: false,
                mensagem: 'Credenciais inválidas'
            });
        }

        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
            console.warn(`🔐 Hub-login: Senha inválida - Email: ${email}, IP: ${clientIp}`);
            return res.status(401).json({
                autenticado: false,
                mensagem: 'Credenciais inválidas'
            });
        }

        if (!user.emailVerified) {
            console.warn(`🔐 Hub-login: Email não verificado - Email: ${email}, IP: ${clientIp}`);
            return res.status(401).json({
                autenticado: false,
                mensagem: 'Seu email ainda não foi verificado. Por favor, verifique sua caixa de entrada.'
            });
        }

        // ✅ GERAR TOKEN DE USO ÚNICO (SSO TOKEN)
        const ssoToken = crypto.randomBytes(32).toString('hex');
        const ssoTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // Expira em 5 minutos

        await prisma.user.update({
            where: { id: user.id },
            data: {
                ssoToken,
                ssoTokenExpiresAt
            }
        });

        const elapsed = Date.now() - startTime;
        console.log(`✅ Hub-login: Sucesso - User: ${user.name} (${email}), IP: ${clientIp}, Time: ${elapsed}ms`);

        res.json({
            autenticado: true,
            userName: user.name,
            ssoToken: ssoToken // ✅ ENVIAR O TOKEN PARA O CANELLAHUB
        });

    } catch (error) {
        const elapsed = Date.now() - startTime;
        console.error(`❌ Hub-login: Erro - IP: ${clientIp}, Time: ${elapsed}ms`, error);
        res.status(500).json({ autenticado: false, mensagem: 'Erro interno do servidor' });
    }
};

// ✅ NOVA: ROTA PARA LOGIN AUTOMÁTICO DO CONTASK (SSO)
export const ssoLogin = async (req: Request, res: Response) => {
    try {
        const { token: ssoToken } = req.body;

        if (!ssoToken) {
            return res.status(400).json({ error: 'Token SSO é obrigatório' });
        }

        const user = await prisma.user.findUnique({
            where: { ssoToken }
        });

        if (!user || !user.ssoTokenExpiresAt || new Date() > user.ssoTokenExpiresAt) {
            // Limpar token para segurança, mesmo que não encontre
            if (user) {
                await prisma.user.update({ where: { id: user.id }, data: { ssoToken: null, ssoTokenExpiresAt: null } });
            }
            return res.status(401).json({ error: 'Token SSO inválido ou expirado.' });
        }

        // Limpar o token após o uso para garantir que seja de uso único
        await prisma.user.update({ where: { id: user.id }, data: { ssoToken: null, ssoTokenExpiresAt: null } });

        // Gerar o token de sessão normal do Contask
        const sessionToken = generateToken(user.id);
        const { password: _, ...userSafe } = user;

        res.json({ message: 'Login SSO realizado com sucesso', user: userSafe, token: sessionToken });

    } catch (error) {
        console.error('Erro no login SSO:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// ✅ VERIFICAR EMAIL
// controllers/authController.ts - VERIFICAR SE ESTÁ RETORNANDO CORRETAMENTE
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                error: 'Token de verificação é obrigatório'
            });
        }

        const user = await prisma.user.findUnique({
            where: { emailVerificationToken: token }
        });

        if (!user) {
            return res.status(400).json({
                error: 'Token de verificação inválido'
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                error: 'Email já foi verificado'
            });
        }

        if (user.tokenExpiresAt && isTokenExpired(user.tokenExpiresAt)) {
            return res.status(400).json({
                error: 'Token expirado. Solicite um novo.',
                tokenExpired: true
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: true,
                emailVerificationToken: null,
                tokenExpiresAt: null
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                emailVerified: true
            }
        });

        await sendWelcomeEmail(user.email, user.name);

        // ✅ RETORNAR RESPOSTA PADRONIZADA
        res.status(200).json({
            message: 'Email verificado com sucesso!',
            user: updatedUser
        });

    } catch (error) {
        console.error('Erro na verificação:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
};

// ✅ REENVIAR EMAIL
export const resendVerificationEmail = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Email é obrigatório'
            });
        }

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            });
        }

        if (user.emailVerified) {
            return res.status(400).json({
                error: 'Email já foi verificado'
            });
        }

        const emailVerificationToken = generateEmailVerificationToken();
        const tokenExpiresAt = getTokenExpirationDate();

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationToken,
                tokenExpiresAt
            }
        });

        const emailSent = await sendVerificationEmail(email, user.name, emailVerificationToken);

        if (!emailSent) {
            return res.status(500).json({
                error: 'Erro ao enviar email'
            });
        }

        res.json({
            message: 'Email reenviado com sucesso!'
        });

    } catch (error) {
        console.error('Erro ao reenviar:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
};

// ✅ GET ME ATUALIZADO
export const getMe = async (req: any, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId},
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                emailVerified: true,
                createdAt: true
            }
        })

        if (!user) {
            return res.status(404).json({
                error: 'Usuário não encontrado'
            })
        }

        res.json({ user })

    } catch (error) {
        console.error('Erro ao obter usuário:', error)
        res.status(500).json({
            error: 'Erro interno do servidor'
        })
    }
}

// ✅ NOVA: SOLICITAR RECUPERAÇÃO DE SENHA
export const requestPasswordReset = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                error: 'Email é obrigatório'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Email inválido'
            });
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        // ✅ SEMPRE RETORNAR SUCESSO (SEGURANÇA - NÃO REVELAR SE EMAIL EXISTE)
        if (!user) {
            return res.status(200).json({
                message: 'Se o email existir em nossa base, você receberá instruções para recuperação.'
            });
        }

        // ✅ VERIFICAR SE USUÁRIO TEM EMAIL CONFIRMADO
        if (!user.emailVerified) {
            return res.status(400).json({
                error: 'Email não verificado. Confirme seu email antes de recuperar a senha.'
            });
        }

        const passwordResetToken = generatePasswordResetToken();
        const passwordResetExpiresAt = getPasswordResetExpirationDate();

        // Atualizar usuário com token de reset
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken,
                passwordResetExpiresAt
            }
        });

        // Enviar email de recuperação
        const emailSent = await sendPasswordResetEmail(user.email, user.name, passwordResetToken);

        if (!emailSent) {
            return res.status(500).json({
                error: 'Erro ao enviar email de recuperação'
            });
        }

        res.status(200).json({
            message: 'Se o email existir em nossa base, você receberá instruções para recuperação.'
        });

    } catch (error) {
        console.error('Erro ao solicitar recuperação:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
};

// ✅ NOVA: REDEFINIR SENHA
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({
                error: 'Token e nova senha são obrigatórios'
            });
        }

        const user = await prisma.user.findUnique({
            where: { passwordResetToken: token }
        });

        if (!user) {
            return res.status(400).json({
                error: 'Token de recuperação inválido'
            });
        }

        if (!user.passwordResetExpiresAt || isTokenExpired(user.passwordResetExpiresAt)) {
            return res.status(400).json({
                error: 'Token de recuperação expirado',
                tokenExpired: true
            });
        }

        // ✅ VERIFICAR SE A NOVA SENHA É DIFERENTE DA ATUAL
        const isSamePassword = await comparePassword(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                error: 'A nova senha deve ser diferente da senha atual'
            });
        }

        const hashedNewPassword = await hashPassword(newPassword);

        // Atualizar senha e limpar tokens
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedNewPassword,
                passwordResetToken: null,
                passwordResetExpiresAt: null
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            }
        });

        // Enviar email de confirmação
        await sendPasswordChangedEmail(user.email, user.name);

        res.status(200).json({
            message: 'Senha alterada com sucesso!',
            user: updatedUser
        });

    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
};

// ✅ NOVA: VERIFICAR TOKEN DE RESET (PARA VALIDAR ANTES DE MOSTRAR FORMULÁRIO)
export const verifyResetToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            return res.status(400).json({
                error: 'Token é obrigatório'
            });
        }

        const user = await prisma.user.findUnique({
            where: { passwordResetToken: token },
            select: {
                id: true,
                email: true,
                passwordResetExpiresAt: true
            }
        });

        if (!user) {
            return res.status(400).json({
                error: 'Token inválido'
            });
        }

        if (!user.passwordResetExpiresAt || isTokenExpired(user.passwordResetExpiresAt)) {
            return res.status(400).json({
                error: 'Token expirado',
                tokenExpired: true
            });
        }

        res.status(200).json({
            message: 'Token válido',
            email: user.email // Para mostrar no formulário
        });

    } catch (error) {
        console.error('Erro ao verificar token:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
};