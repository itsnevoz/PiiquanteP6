const Sauce = require('../models/Sauce');
const fs = require('fs');

//Creation d'une sauce
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  //delete le champs id et userId avant de copier l'objet
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
    //...= Operateur spread pour copier le sauceObject puis rajouter le userId et l'image
      ...sauceObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });

  sauce.save()
  .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
  .catch(error => { res.status(400).json( { error })})
};

//Trouver une sauce
exports.getOneSauce = (req, res, next) => {
  //trouve l'id d'une sauce
  Sauce.findOne({
    _id: req.params.id
  }).then(
    (sauce) => {
      res.status(200).json(sauce);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

//Modifier une sauce
exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ? {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete sauceObject._userId;
  Sauce.findOne({_id: req.params.id})
      .then((sauce) => {
        //if le userId n'est pas le meme que celui qui a poster = impossible de modifier else possible
          if (sauce.userId != req.auth.userId) {
              res.status(401).json({ message : 'Not authorized'});
          } else {
              Sauce.updateOne({ _id: req.params.id}, { ...sauceObject, _id: req.params.id})
              .then(() => res.status(200).json({message : 'Objet modifié!'}))
              .catch(error => res.status(401).json({ error }));
          }
      })
      .catch((error) => {
          res.status(400).json({ error });
      });
};

//Supprimer une sauce
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id})
      .then(sauce => {
          if (sauce.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'});
          } else {
              const filename = sauce.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                  Sauce.deleteOne({_id: req.params.id})
                      .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};

//Trouver toutes les sauces
exports.getAllSauces = (req, res, next) => {
  Sauce.find().then(
    (sauces) => {
      res.status(200).json(sauces);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

function sendClientResponse(sauce, res) {
  //si la sauce n'existe pas = error object not fund sinon return la sauce demander
  if (sauce == null) {
    return res.status(404).send({message: "object not found"})
  }
  return Promise.resolve(res.status(200).send(sauce)).then(() => sauce)
}

exports.likeSauce = (req, res, sauce) => {
  const {like, userId} = req.body
  //si ca n'est pas = a 0,1,-1 cette operation n'existe pas donc return erreur
  if (![0, -1, 1].includes(like)) return res.status(400).send({ message: "Bad request"})

   Sauce.findOne({_id: req.params.id})
   .then((sauce) => updateVote(sauce, like, userId, res))
   .then(pr => pr.save())
   .then(prod => sendClientResponse(prod, res))
   .catch((err) => res.status(500).send(err))
}

//Si like ou dislike execute sinon resetVote
function updateVote(sauce, like, userId) {
  if (like ===1 || like === -1) return incrementVote(sauce, userId, like)
  return resetVote(sauce, userId)
}

//resetVote 
function resetVote(sauce, userId, res) {
  const { usersLiked, usersDisliked} = sauce
  //si userLiked et userDislike possedent un userId en commun return une erreur
  if ([usersLiked, usersDisliked].every(arr => arr.includes(userId))) return Promise.reject("user have voted like and dislike")
  //si userId n'est ni dans userLiked ni userDislike return erreur impossible de reset le vote
  if (![usersLiked, usersDisliked].some(arr => arr.includes(userId))) return Promise.reject("user have not voted")

  //enlever un like si cest le like qu'on doit enlever et dislike si cest le dislike
  usersLiked.includes(userId) ? --sauce.likes : --sauce.dislikes


  if (usersLiked.includes(userId)){
    sauce.usersLiked = sauce.usersLiked.filter(id => id !== userId)
  } else {
    sauce.usersDisliked = sauce.usersDisliked.filter(id => id !== userId)
  }
  return sauce
}

//like ou dislike
function incrementVote(sauce, userId, like) {
  const {usersLiked, usersDisliked} = sauce
  const votersArray = like === 1 ? usersLiked : usersDisliked
  if (votersArray.includes(userId)) return sauce
  votersArray.push(userId)

  like === 1 ? ++sauce.likes : ++sauce.dislikes
  return sauce
}
