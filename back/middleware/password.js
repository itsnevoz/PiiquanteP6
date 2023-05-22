const passwordValidator = require('password-validator');

const passwordSchema = new passwordValidator();

//le schema du mdp
passwordSchema
.is().min(5)                                    // Minimum length 6
.is().max(100)                                  // Maximum length 13
.has().digits(2)                                // Must have at least 2 digits
.has().not().spaces()                           // Should not have spaces

module.exports = (req, res, next) => {
if(passwordSchema.validate(req.body.password)){
    next();
} else {
    return res
    .status(400)
    .json({error: "le mot de passe n'est pas assez fort :"+passwordSchema.validate(req.body.password, { list: true })})
}
}
