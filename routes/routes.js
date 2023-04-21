import express from 'express';
import upload from '../middlewares/uploadFile.js';
import manualUpload from '../middlewares/uploadManualFile.js';
import {
    showHomepage,
    uploadWeightForm,
    uploadWeight,
    uploadManualWeightForm,
    uploadManualWeight,
    showTable,
    showNewTable,
    showAverageTable,
    showAverageTable10,
    fillManualWeight
} from '../controllers/controller.js';

const router = express.Router();


router.get('/', showHomepage);

router.get('/uploadWeight', uploadWeightForm);
router.post('/uploadWeight', upload.single('weight'), uploadWeight);

router.get('/uploadManualWeight', uploadManualWeightForm);
router.post('/uploadManualWeight', manualUpload.single('manualWeight'), uploadManualWeight);

router.get('/weightTable', showTable);
router.get('/newWeightTable', showNewTable);
router.get('/averageTable', showAverageTable);
router.get('/averageTable10', showAverageTable10);

router.get('/cargarPesadas', fillManualWeight);


export default router;