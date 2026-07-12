import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { DocumentoController } from '../controllers/DocumentoController';

const baseUploadDir = path.join(__dirname, '../../../../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Mapear el tipo a nombre de carpeta
    const tipoStr = req.body.tipo ? req.body.tipo.toString().toLowerCase() : 'otros';
    let folderName = 'otros';
    
    if (tipoStr.includes('cedula') || tipoStr.includes('cédula')) folderName = 'cedulas';
    else if (tipoStr.includes('licencia')) folderName = 'licencias';
    else if (tipoStr.includes('matricula') || tipoStr.includes('matrícula')) folderName = 'matriculas';
    else if (tipoStr.includes('revision') || tipoStr.includes('revisión')) folderName = 'revisiones';
    else if (tipoStr.includes('soat')) folderName = 'soat';

    const targetDir = path.join(baseUploadDir, folderName);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
const router = Router();
const documentoController = new DocumentoController();

router.get('/', documentoController.getAll);
router.post('/upload', upload.single('documento'), documentoController.upload);
router.post('/import', upload.single('documento'), documentoController.import);
router.delete('/:id', documentoController.delete);

export default router;
