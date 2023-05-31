const multer = require('multer');

//multer pour transformer les jpg et jpeg en jpg et png en png
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    //remplace les espace par des _ dans le nom de l'image
    const name = file.originalname.split(' ').join('_');
    //converti les format d'image
    const extension = MIME_TYPES[file.mimetype];
    //nom + date exact + . + format defini par mime_types
    callback(null, name + Date.now() + '.' + extension);
  }
});

module.exports = multer({storage: storage}).single('image');