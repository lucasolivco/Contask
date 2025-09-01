import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

interface EmailData {
  to: string
  subject: string
  template: 'task-assigned' | 'task-completed' | 'task-overdue' | 'task-updated' | 'task-cancelled' | 'comment-added' | 'attachment-added'
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


const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

const emailTemplates = {
  'task-assigned': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0891b2; color: white; padding: 20px; text-align: center;">
        <h1>📋 ${data.isReassignment ? 'Tarefa Reatribuída' : 'Nova Tarefa Atribuída'}</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Olá <strong>${data.userName}</strong>,</p>
        <p>${data.isReassignment ? 'Uma tarefa foi reatribuída para você:' : 'Você recebeu uma nova tarefa:'}</p>
        
        <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0891b2;">
          <h3 style="margin: 0 0 10px 0; color: #164e63;">${data.taskTitle}</h3>
          ${data.taskDescription ? `<p style="margin: 0; color: #475569;">${data.taskDescription}</p>` : ''}
        </div>
        
        ${data.dueDate ? `<p><strong>📅 Data de vencimento:</strong> ${data.dueDate}</p>` : ''}
        ${data.priority ? `<p><strong>🔥 Prioridade:</strong> ${data.priority}</p>` : ''}
        <p><strong>👤 ${data.isReassignment ? 'Reatribuída' : 'Atribuída'} por:</strong> ${data.managerName}</p>
        
        ${data.isReassignment && data.previousAssignee ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              <strong>🔄 Reatribuição:</strong> Esta tarefa estava anteriormente com ${data.previousAssignee}
            </p>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${BASE_URL}/tasks" 
             style="background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver Tarefa
          </a>
        </div>
      </div>
      
      <div style="background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 14px;">
        Sistema de Gerenciamento de Tarefas - Contask
      </div>
    </div>
  `,

  'task-completed': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #059669; color: white; padding: 20px; text-align: center;">
        <h1>✅ Tarefa Concluída</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Olá <strong>${data.managerName}</strong>,</p>
        <p>Uma tarefa foi marcada como concluída:</p>
        
        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3 style="margin: 0 0 10px 0; color: #164e63;">${data.taskTitle}</h3>
          <p style="margin: 0; color: #475569;">Concluída por: <strong>${data.assignedUserName}</strong></p>
          <p style="margin: 5px 0 0 0; color: #475569;">Data de conclusão: ${data.completedDate}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${BASE_URL}/tasks" 
             style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver Detalhes
          </a>
        </div>
      </div>
    </div>
  `,

  'task-overdue': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
        <h1>⚠️ ${data.dueTomorrow ? 'Tarefa Vence Amanhã!' : 'Tarefa Atrasada!'}</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Olá <strong>${data.userName}</strong>,</p>
        <p><strong>${data.dueTomorrow ? 'Lembrete:' : 'Atenção:'}</strong> ${data.dueTomorrow ? 'Sua tarefa vence amanhã!' : 'Você tem uma tarefa atrasada!'}</p>
        
        <div style="background: ${data.dueTomorrow ? '#fef3c7' : '#fee2e2'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${data.dueTomorrow ? '#f59e0b' : '#dc2626'};">
          <h3 style="margin: 0 0 10px 0; color: ${data.dueTomorrow ? '#92400e' : '#991b1b'};">${data.taskTitle}</h3>
          <p style="margin: 5px 0; color: ${data.dueTomorrow ? '#92400e' : '#991b1b'};">
            <strong>📅 Data de vencimento:</strong> ${data.dueDate}
          </p>
          <p style="margin: 5px 0; color: ${data.dueTomorrow ? '#92400e' : '#991b1b'};">
            <strong>👤 Atribuída por:</strong> ${data.managerName}
          </p>
        </div>
        
        <p style="text-align: center;">
          <a href="${BASE_URL}/tasks" 
             style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            📋 ${data.dueTomorrow ? 'Concluir Tarefa' : 'Ver Tarefa Atrasada'}
          </a>
        </p>
      </div>
    </div>
  `,

  'task-updated': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #ea580c; color: white; padding: 20px; text-align: center;">
        <h1>🔄 Tarefa Atualizada</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Olá <strong>${data.userName}</strong>,</p>
        <p>Uma tarefa foi atualizada:</p>
        
        <div style="background: #fff7ed; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
          <h3 style="margin: 0 0 10px 0; color: #9a3412;">${data.taskTitle}</h3>
          <p style="margin: 5px 0; color: #c2410c;">
            <strong>🔄 Atualizada por:</strong> ${data.updatedBy}
          </p>
          <p style="margin: 5px 0; color: #c2410c;">
            <strong>📅 Data da atualização:</strong> ${data.updatedDate}
          </p>
        </div>
        
        ${data.changedFields && data.changedFields.length > 0 ? `
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #1e40af;">📋 Campos alterados:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #1e40af;">
              ${data.changedFields.map((field: string) => `<li>${field}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${BASE_URL}/tasks" 
             style="background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver Tarefa
          </a>
        </div>
      </div>
    </div>
  `,

  'task-cancelled': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #6b7280; color: white; padding: 20px; text-align: center;">
        <h1>❌ Tarefa Cancelada</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Olá <strong>${data.userName}</strong>,</p>
        <p>Uma tarefa foi cancelada:</p>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280;">
          <h3 style="margin: 0 0 10px 0; color: #374151;">${data.taskTitle}</h3>
          <p style="margin: 5px 0; color: #4b5563;">
            <strong>❌ Cancelada por:</strong> ${data.cancelledBy}
          </p>
          <p style="margin: 5px 0; color: #4b5563;">
            <strong>📅 Data do cancelamento:</strong> ${data.cancelledDate}
          </p>
          ${data.reason ? `
            <p style="margin: 5px 0; color: #4b5563;">
              <strong>📝 Motivo:</strong> ${data.reason}
            </p>
          ` : ''}
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${BASE_URL}/tasks" 
             style="background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver Todas as Tarefas
          </a>
        </div>
      </div>
    </div>
  `,
  'comment-added': (data: any) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #0891b2; color: white; padding: 20px; text-align: center;">
      <h1>💬 Novo Comentário</h1>
    </div>
    
    <div style="padding: 20px;">
      <p>Olá <strong>${data.recipientName}</strong>,</p>
      
      <p>${data.commentAuthor} adicionou um comentário ${data.isCreator ? 'na tarefa que você criou' : 'na tarefa'}:</p>
      
      <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0891b2;">
        <h3 style="margin: 0 0 10px 0; color: #164e63;">${data.taskTitle}</h3>
      </div>
      
      <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <strong style="color: #374151;">${data.commentAuthor}</strong>
          <span style="color: #6b7280; font-size: 12px; margin-left: 10px;">${data.commentDate}</span>
        </div>
        <p style="margin: 0; color: #374151; line-height: 1.5;">${data.commentMessage}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.taskUrl}" 
          style="background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Ver Tarefa e Responder
        </a>
      </div>
    </div>
    
    <div style="background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 14px;">
      Sistema de Gerenciamento de Tarefas - Contask
    </div>
  </div>
  `,

  'attachment-added': (data: any) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #059669; color: white; padding: 20px; text-align: center;">
        <h1>📎 Novo Anexo</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Olá <strong>${data.recipientName}</strong>,</p>
        
        <p>${data.uploaderName} anexou ${data.fileCount > 1 ? `${data.fileCount} arquivos` : 'um arquivo'} ${data.isCreator ? 'na tarefa que você criou' : 'na tarefa'}:</p>
        
        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
          <h3 style="margin: 0 0 10px 0; color: #164e63;">${data.taskTitle}</h3>
        </div>
        
        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <strong style="color: #374151;">📎 ${data.fileCount > 1 ? 'Arquivos anexados' : 'Arquivo anexado'}</strong>
            <span style="color: #6b7280; font-size: 12px; margin-left: 10px;">${data.attachmentDate}</span>
          </div>
          <div style="background: #f9fafb; padding: 10px; border-radius: 6px;">
            <p style="margin: 0; color: #374151; font-family: monospace; font-size: 14px;">${data.fileNames}</p>
          </div>
          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
            Por: <strong>${data.uploaderName}</strong>
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.taskUrl}" 
            style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Ver Tarefa e Anexos
          </a>
        </div>
      </div>
      
      <div style="background: #f8fafc; padding: 15px; text-align: center; color: #64748b; font-size: 14px;">
        Sistema de Gerenciamento de Tarefas - Contask
      </div>
    </div>
  `
}

// ✅ FUNÇÃO EXISTENTE PARA NOTIFICAÇÕES DE TAREFAS
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('⚠️ Configurações de email não definidas - simulando envio')
      return true
    }

    const template = emailTemplates[emailData.template]
    if (!template) {
      console.error('❌ Template não encontrado:', emailData.template)
      return false
    }

    const html = template(emailData.data)

    const mailOptions = {
      from: {
        name: 'Contask - Task Manager',
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

export const testEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify()
    console.log('✅ Conexão com email OK')
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