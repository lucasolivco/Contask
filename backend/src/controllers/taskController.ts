// "Cérebro" que gerencia todas as operações com tarefas
import { Request, Response } from 'express';
import prisma from '../config/database';

// Interface para tipar as requisições com usuário autenticado
interface AuthRequest extends Request {
    user?: {
        userId: string
        role: string
    }
}

