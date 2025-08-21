import { useState, useEffect } from 'react'
import { 
  X, 
  Calendar, 
  User, 
  Clock, 
  Target, 
  CalendarPlus, 
  Paperclip, 
  Send, 
  Download,
  FileText,
  Image,
  File,
  MessageCircle,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import type { Task } from '../../types'
import { getTaskComments, createComment, type Comment } from '../../services/commentService'
import { getTaskAttachments, uploadAttachments, downloadAttachment, type Attachment } from '../../services/attachmentService'

interface TaskDetailsModalProps {
  task: Task
  isOpen: boolean
  onClose: () => void
  userRole: string
  currentUser?: { id: string; name: string; email: string }
}

const TaskDetailsModal = ({ task, isOpen, onClose, userRole, currentUser }: TaskDetailsModalProps) => {
  const [newComment, setNewComment] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  
  // Loading states
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false)
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  if (!isOpen) return null

  // ✅ CARREGAR dados ao abrir modal
  useEffect(() => {
    if (isOpen && task.id) {
      loadComments()
      loadAttachments()
    }
  }, [isOpen, task.id])

  // Carregar comentários
  const loadComments = async () => {
    setIsLoadingComments(true)
    try {
      const data = await getTaskComments(task.id)
      setComments(data.comments)
    } catch (error: any) {
      console.error('Erro ao carregar comentários:', error)
      toast.error('Erro ao carregar comentários')
    } finally {
      setIsLoadingComments(false)
    }
  }

  // Carregar anexos
  const loadAttachments = async () => {
    setIsLoadingAttachments(true)
    try {
      const data = await getTaskAttachments(task.id)
      setAttachments(data.attachments)
    } catch (error: any) {
      console.error('Erro ao carregar anexos:', error)
      toast.error('Erro ao carregar anexos')
    } finally {
      setIsLoadingAttachments(false)
    }
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'
  const isNearTarget = task.targetDate && new Date(task.targetDate) < new Date() && task.status !== 'COMPLETED'

  const getStatusBadge = () => {
    const statusClasses = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800', 
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusClasses[task.status]}`}>
        {task.status === 'PENDING' && '⏳ Pendente'}
        {task.status === 'IN_PROGRESS' && '🔄 Em Progresso'}
        {task.status === 'COMPLETED' && '✅ Completada'}
        {task.status === 'CANCELLED' && '❌ Cancelada'}
      </span>
    )
  }

  const getPriorityBadge = () => {
    const priorityClasses = {
      LOW: 'bg-gray-100 text-gray-700',
      MEDIUM: 'bg-blue-100 text-blue-700',
      HIGH: 'bg-orange-100 text-orange-700',
      URGENT: 'bg-red-100 text-red-700'
    }

    const priorityIcons = {
      LOW: '📝',
      MEDIUM: '📋', 
      HIGH: '⚡',
      URGENT: '🚨'
    }
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${priorityClasses[task.priority]}`}>
        <span>{priorityIcons[task.priority]}</span>
        {task.priority === 'LOW' && 'Baixa'}
        {task.priority === 'MEDIUM' && 'Média'}
        {task.priority === 'HIGH' && 'Alta'}
        {task.priority === 'URGENT' && 'Urgente'}
      </span>
    )
  }

  // ✅ UPLOAD REAL de arquivo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingFile(true)
    
    try {
      const filesArray = Array.from(files)
      const data = await uploadAttachments(task.id, filesArray)
      
      // Atualizar lista de anexos
      setAttachments(prev => [...data.attachments, ...prev])
      toast.success(data.message)
      
      // Limpar input
      e.target.value = ''
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error)
      toast.error(error.response?.data?.error || 'Erro ao fazer upload do arquivo')
    } finally {
      setIsUploadingFile(false)
    }
  }

  // ✅ ENVIO REAL de comentário
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setIsSubmittingComment(true)
    
    try {
      const data = await createComment(task.id, newComment.trim())
      
      // Adicionar comentário à lista
      setComments(prev => [...prev, data.comment])
      setNewComment('')
      toast.success('Comentário adicionado com sucesso')
    } catch (error: any) {
      console.error('Erro ao enviar comentário:', error)
      toast.error(error.response?.data?.error || 'Erro ao enviar comentário')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // ✅ DOWNLOAD REAL de anexo
  const handleDownload = async (attachment: Attachment) => {
    try {
      await downloadAttachment(attachment.id, attachment.originalName)
      toast.success(`Download de ${attachment.originalName} iniciado`)
    } catch (error: any) {
      console.error('Erro ao fazer download:', error)
      toast.error('Erro ao fazer download do arquivo')
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="h-5 w-5 text-blue-500" />
    }
    if (['pdf'].includes(extension || '')) {
      return <FileText className="h-5 w-5 text-red-500" />
    }
    return <File className="h-5 w-5 text-gray-500" />
  }

  // ✅ FUNÇÃO para formatar tamanho do arquivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {getPriorityBadge()}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Conteúdo Principal */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Alertas */}
            {isOverdue && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <Clock className="h-5 w-5" />
                  <span className="font-medium">Tarefa em atraso!</span>
                </div>
              </div>
            )}

            {isNearTarget && !isOverdue && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700">
                  <Target className="h-5 w-5" />
                  <span className="font-medium">Próximo da data meta!</span>
                </div>
              </div>
            )}

            {/* Descrição */}
            {task.description && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Descrição</h3>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg">
                  {task.description}
                </p>
              </div>
            )}

            {/* Informações da Tarefa */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <CalendarPlus className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Criada em</p>
                    <p className="font-medium">
                      {new Date(task.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {task.targetDate && (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Target className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Data meta</p>
                      <p className={`font-medium ${isNearTarget ? 'text-amber-600' : 'text-blue-600'}`}>
                        {new Date(task.targetDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}

                {task.dueDate && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Vence em</p>
                      <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                        {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Criado por</p>
                    <p className="font-medium">{task.createdBy.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <User className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Atribuído para</p>
                    <p className="font-medium text-blue-600">{task.assignedTo.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ ANEXOS COM API REAL */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Paperclip className="h-5 w-5" />
                  Anexos ({attachments.length})
                  {isLoadingAttachments && <Loader2 className="h-4 w-4 animate-spin" />}
                </h3>
                <label className={`cursor-pointer text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  isUploadingFile 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                  {isUploadingFile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Paperclip className="h-4 w-4" />
                      Adicionar Arquivo
                    </>
                  )}
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    disabled={isUploadingFile}
                    className="hidden"
                    accept="*/*"
                  />
                </label>
              </div>

              {isLoadingAttachments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Carregando anexos...</span>
                </div>
              ) : attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        {getFileIcon(attachment.originalName)}
                        <div>
                          <p className="font-medium text-gray-900">{attachment.originalName}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(attachment.fileSize)} • 
                            Enviado por {attachment.uploadedBy.name} • 
                            {new Date(attachment.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDownload(attachment)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  <Paperclip className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Nenhum anexo encontrado</p>
                  <p className="text-sm">Adicione arquivos para compartilhar com a equipe</p>
                </div>
              )}
            </div>
          </div>

          {/* ✅ CHAT COM API REAL */}
          <div className="w-96 border-l border-gray-200 flex flex-col bg-gray-50">
            {/* Header do Chat */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comentários ({comments.length})
                {isLoadingComments && <Loader2 className="h-4 w-4 animate-spin" />}
              </h3>
              <p className="text-sm text-gray-500">Conversa da equipe sobre esta tarefa</p>
            </div>

            {/* Lista de Comentários */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingComments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Carregando comentários...</span>
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{comment.author.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          comment.author.role === 'MANAGER' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {comment.author.role === 'MANAGER' ? 'Gerente' : 'Funcionário'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{comment.message}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Nenhum comentário ainda</p>
                  <p className="text-sm">Seja o primeiro a comentar!</p>
                </div>
              )}
            </div>

            {/* Form de Novo Comentário */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSubmitComment} className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmittingComment}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmittingComment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Enviar Comentário
                    </>
                  )}
                </button>
              </form>
              
              <p className="text-xs text-gray-500 mt-2">
                💡 Tanto gerentes quanto funcionários podem adicionar anexos e comentários
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TaskDetailsModal