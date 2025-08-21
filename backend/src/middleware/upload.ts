import multer from 'multer'
import path from 'path'
import fs from 'fs-extra'

// Criar diretório de uploads se não existir
const uploadsDir = path.join(__dirname, '../../uploads')
fs.ensureDirSync(uploadsDir)

// Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Criar subpasta por data
    const dateFolder = new Date().toISOString().split('T')[0]
    const uploadPath = path.join(uploadsDir, dateFolder)
    fs.ensureDirSync(uploadPath)
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Nome único: timestamp_originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const extension = path.extname(file.originalname)
    const name = path.basename(file.originalname, extension)
    cb(null, `${uniqueSuffix}_${name}${extension}`)
  }
})

// Filtro de arquivos
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Tipo de arquivo não permitido'), false)
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
})