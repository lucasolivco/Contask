import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config()

interface EmailData {
  to: string
  subject: string
  template: 'task-assigned' | 'task-completed' | 'task-overdue'
  data: any
}

// ✅ CORRIGIDO: createTransport (sem "er" no final)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

// Templates de email
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

// Função para testar configuração de email
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