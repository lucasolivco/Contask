import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

interface EmailData {
  to: string
  subject: string
  template: 'task-assigned' | 'task-completed' | 'task-overdue'
  data: any
}

// ✅ TRANSPORTADOR DE EMAIL
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

const BASE_URL = process.env.FRONTEND_URL;

// ✅ TEMPLATES EXISTENTES DE TAREFAS
const emailTemplates = {
  'task-assigned': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #3B82F6; color: white; padding: 20px; text-align: center;">
        <h1>📋 Nova Tarefa Atribuída</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Olá <strong>${data.userName}</strong>,</p>
        
        <p>Você recebeu uma nova tarefa:</p>
        
        <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; color: #1F2937;">${data.taskTitle}</h3>
          ${data.taskDescription ? `<p style="margin: 0; color: #6B7280;">${data.taskDescription}</p>` : ''}
        </div>
        
        ${data.dueDate ? `<p><strong>📅 Data de vencimento:</strong> ${data.dueDate}</p>` : ''}
        <p><strong>👤 Atribuída por:</strong> ${data.managerName}</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/tasks" 
             style="background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver Tarefa
          </a>
        </div>
      </div>
      
      <div style="background: #F9FAFB; padding: 15px; text-align: center; color: #6B7280; font-size: 14px;">
        Sistema de Gerenciamento de Tarefas
      </div>
    </div>
  `,

  'task-completed': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #10B981; color: white; padding: 20px; text-align: center;">
        <h1>✅ Tarefa Concluída</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Olá <strong>${data.managerName}</strong>,</p>
        
        <p>Uma tarefa foi marcada como concluída:</p>
        
        <div style="background: #ECFDF5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
          <h3 style="margin: 0 0 10px 0; color: #1F2937;">${data.taskTitle}</h3>
          <p style="margin: 0; color: #6B7280;">Concluída por: <strong>${data.employeeName}</strong></p>
          <p style="margin: 5px 0 0 0; color: #6B7280;">Data de conclusão: ${data.completedDate}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/tasks" 
             style="background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver Detalhes
          </a>
        </div>
      </div>
      
      <div style="background: #F9FAFB; padding: 15px; text-align: center; color: #6B7280; font-size: 14px;">
        Sistema de Gerenciamento de Tarefas
      </div>
    </div>
  `,

   'task-overdue': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #F59E0B; color: white; padding: 20px; text-align: center;">
        <h1>⏰ Tarefa Vence Amanhã!</h1>
      </div>
      <div style="padding: 20px;">
        <p>Olá <strong>${data.userName}</strong>,</p>
        <p><strong>Lembrete importante:</strong> Sua tarefa vence amanhã!</p>
        
        <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B;">
          <h3 style="margin: 0 0 10px 0; color: #92400E;">${data.taskTitle}</h3>
          <p style="margin: 5px 0; color: #92400E;">
            <strong>📅 Data de vencimento:</strong> ${data.dueDate}
          </p>
          <p style="margin: 5px 0; color: #92400E;">
            <strong>⏰ Tempo restante:</strong> ${data.dueTomorrow ? 'Vence AMANHÃ' : '1 dia'}
          </p>
          <p style="margin: 5px 0; color: #92400E;">
            <strong>👤 Atribuída por:</strong> ${data.managerName}
          </p>
        </div>
        
        <div style="background: #FEF2F2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 3px solid #EF4444;">
          <p style="margin: 0; color: #DC2626;">
            🚨 <strong>Atenção:</strong> Esta tarefa deve ser concluída até amanhã. Organize seu tempo!
          </p>
        </div>
        
        <p style="text-align: center;">
          <a href="${process.env.FRONTEND_URL}/tasks" 
             style="background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            📋 Concluir Tarefa Agora
          </a>
        </p>
        
        <p style="font-size: 12px; color: #6B7280; text-align: center; margin-top: 20px;">
          Você recebeu este aviso porque a tarefa vence amanhã.
        </p>
      </div>
    </div>
  `
}

// ✅ FUNÇÃO EXISTENTE PARA NOTIFICAÇÕES DE TAREFAS
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    // Verificar se as configurações de email estão definidas
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('⚠️ Configurações de email não definidas - simulando envio')
      return true // Simular sucesso em desenvolvimento
    }

    const template = emailTemplates[emailData.template]
    if (!template) {
      console.error('❌ Template de email não encontrado:', emailData.template)
      return false
    }

    const html = template(emailData.data)

    const mailOptions = {
      from: {
        name: 'Tarefas - Task Manager',
        address: process.env.SMTP_USER!
      },
      to: emailData.to,
      subject: emailData.subject,
      html
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('✅ Email enviado:', result.messageId)
    return true

  } catch (error) {
    console.error('❌ Erro ao enviar email:', error)
    return false
  }
}

// ✅ FUNÇÃO EXISTENTE PARA TESTAR CONEXÃO
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify()
    console.log('✅ Conexão com email configurada corretamente')
    return true
  } catch (error) {
    console.error('❌ Erro na configuração de email:', error)
    return false
  }
}

// ✅ NOVA: ENVIAR EMAIL DE VERIFICAÇÃO
export const sendVerificationEmail = async (email: string, name: string, token: string): Promise<boolean> => {
    const verificationUrl = `${BASE_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@taskmanager.com',
        to: email,
        subject: '📧 Confirme seu email - Task Manager',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #e11d48;">Bem-vindo ao Task Manager!</h2>
                <p>Olá <strong>${name}</strong>,</p>
                <p>Obrigado por se cadastrar! Para ativar sua conta, clique no botão abaixo:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="background-color: #e11d48; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Confirmar Email
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                    Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                    <a href="${verificationUrl}">${verificationUrl}</a>
                </p>
                <p style="color: #666; font-size: 12px;">
                    Este link expira em 24 horas. Se você não criou esta conta, ignore este email.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Erro ao enviar email de verificação:', error);
        return false;
    }
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
    const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@taskmanager.com',
        to: email,
        subject: '🎉 Conta ativada - Task Manager',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">Conta ativada com sucesso!</h2>
                <p>Olá <strong>${name}</strong>,</p>
                <p>Sua conta foi ativada com sucesso! Agora você pode:</p>
                <ul>
                    <li>Acessar o dashboard</li>
                    <li>Gerenciar suas tarefas</li>
                    <li>Receber notificações</li>
                    <li>Colaborar com sua equipe</li>
                </ul>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${BASE_URL}/login" 
                       style="background-color: #059669; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Acessar Plataforma
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                    Bem-vindo à equipe! 🚀
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Erro ao enviar email de boas-vindas:', error);
        return false;
    }
};

// ✅ NOVO: EMAIL DE RECUPERAÇÃO DE SENHA
export const sendPasswordResetEmail = async (email: string, name: string, token: string): Promise<boolean> => {
    const resetUrl = `${BASE_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@taskmanager.com',
        to: email,
        subject: '🔐 Recuperação de senha - Task Manager',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Recuperação de senha</h2>
                <p>Olá <strong>${name}</strong>,</p>
                <p>Você solicitou a recuperação da sua senha. Clique no botão abaixo para criar uma nova senha:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetUrl}" 
                       style="background-color: #dc2626; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Redefinir Senha
                    </a>
                </div>
                
                <div style="background-color: #fef2f2; border: 1px solid #fecaca; 
                            border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <p style="color: #dc2626; margin: 0; font-weight: bold;">⚠️ Importante:</p>
                    <ul style="color: #991b1b; margin: 10px 0; padding-left: 20px;">
                        <li>Este link expira em <strong>2 horas</strong></li>
                        <li>Use apenas se você solicitou a recuperação</li>
                        <li>Após usar, o link se torna inválido</li>
                    </ul>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                    Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                    <a href="${resetUrl}">${resetUrl}</a>
                </p>
                
                <p style="color: #666; font-size: 12px;">
                    Se você não solicitou esta recuperação, ignore este email. 
                    Sua senha atual permanecerá inalterada.
                </p>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #666; font-size: 11px; text-align: center;">
                    Este email foi enviado automaticamente. Não responda.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Email de recuperação enviado para:', email);
        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar email de recuperação:', error);
        return false;
    }
};

// ✅ NOVO: EMAIL DE CONFIRMAÇÃO DE ALTERAÇÃO DE SENHA
export const sendPasswordChangedEmail = async (email: string, name: string): Promise<boolean> => {
    const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@taskmanager.com',
        to: email,
        subject: '✅ Senha alterada - Task Manager',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #059669;">Senha alterada com sucesso</h2>
                <p>Olá <strong>${name}</strong>,</p>
                <p>Sua senha foi alterada com sucesso em <strong>${new Date().toLocaleString('pt-BR')}</strong>.</p>
                
                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; 
                            border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <p style="color: #059669; margin: 0; font-weight: bold;">✅ Alteração confirmada</p>
                    <p style="color: #047857; margin: 10px 0 0 0;">
                        Sua conta está segura e você já pode fazer login com a nova senha.
                    </p>
                </div>
                
                <div style="background-color: #fef3c7; border: 1px solid #fcd34d; 
                            border-radius: 5px; padding: 15px; margin: 20px 0;">
                    <p style="color: #d97706; margin: 0; font-weight: bold;">🛡️ Não foi você?</p>
                    <p style="color: #92400e; margin: 10px 0 0 0;">
                        Se você não alterou sua senha, entre em contato conosco imediatamente.
                    </p>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${BASE_URL}/login" 
                       style="background-color: #059669; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Fazer Login
                    </a>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #666; font-size: 11px; text-align: center;">
                    Este email foi enviado automaticamente. Não responda.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Email de confirmação enviado para:', email);
        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar email de confirmação:', error);
        return false;
    }
};