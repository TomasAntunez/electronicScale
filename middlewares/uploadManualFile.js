import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        cb(null, 'pesadas.csv');
    }
});

const manualUpload = multer({storage});

export default manualUpload;