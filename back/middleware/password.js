const passwordValidator = require('password-validator');

const passwordSchema = new passwordValidator();

//les parametre obligatoire pour un mot de passe valide
passwordSchema
.is().min(5)                                    // Minimum length 6
.is().max(100)                                  // Maximum length 13
.has().digits(2)                                // Must have at least 2 digits
.has().not().spaces()                           // Should not have spaces

// si le mot de passe valide tous les critere passwordSchema execute sinon message d'erreur avec les condition non respecter
module.exports = (req, res, next) => {
if(passwordSchema.validate(req.body.password)){
    next();
} else {
    return res
    .status(400)
    .json({error: "le mot de passe n'est pas assez fort :"+passwordSchema.validate(req.body.password, { list: true })})
}
}
