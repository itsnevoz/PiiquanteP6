const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

// cree un nouveau compte
exports.signup = (req, res, next) => {
    //hash le mdp 10 fois puis enregistrer le mail + le mdp hasher dans un user
    bcrypt.hash(req.body.password, 10)
      .then(hash => {
        const user = new User({
          email: req.body.email,
          password: hash
        });
        user.save()
          .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
          .catch(error => res.status(400).json({ error }));
      })
      .catch(error => res.status(500).json({ error }));
  };

  // se connecter sur un compte existant
  exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            //si mail correspond pas = user non trouver
            if (!user) {
                return res.status(401).json({ error: 'Utilisateur non trouvé !' });
            }
            //comparer le hash si non valid = mdp incorrect
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        return res.status(401).json({ error: 'Mot de passe incorrect !' });
                    }
                    //si tout est valide donner un token qui a l'utilisateur qui expire dans 24h
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            'RANDOM_TOKEN_SECRET',
                            { expiresIn: '24h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
 };