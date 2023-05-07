const { log } = require('console');
const Sauce = require('../models/Sauce');
const fs = require('fs');

exports.createSauce = (req, res, next) => {
  console.log(req.body);
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
      ...sauceObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });

  sauce.save()
  .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
  .catch(error => { res.status(400).json( { error })})
};

exports.getOneSauce = (req, res, next) => {
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

exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file ? {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete sauceObject._userId;
  Sauce.findOne({_id: req.params.id})
      .then((sauce) => {
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
  if (sauce == null) {
    console.log("nothing");
    return res.status(404).send({message: "object not found"})
  }
  // console.log("updated", sauce);
  return Promise.resolve(res.status(200).send(sauce)).then(() => sauce)
}

exports.likeSauce = (req, res, sauce) => {
  const {like, userId} = req.body
  //like === 0, -1, 1
  if (![0, -1, 1].includes(like)) return res.status(400).send({ message: "Bad request"})

   Sauce.findOne({_id: req.params.id})
   .then((sauce) => updateVote(sauce, like, userId))
   .then(prod => sendClientResponse(prod, res))
   .catch((err) => res.status(500).send(err))
}

function updateVote(sauce, like, userId) {
  if (like === 1) incrementLike(sauce, userId)
  if (like === -1) decrementLike(sauce, userId)
  if (like === 0) resetVote(sauce, userId)
  return sauce.save()
}

function incrementLike(sauce, userId) {
  const {usersLiked} = sauce
  if (usersLiked.includes(userId)) 
  return 
  usersLiked.push(userId)
  sauce.likes++
  console.log("nombre de like:", sauce.likes);
}

function decrementLike(sauce, userId) {
  const usersDisliked = sauce.usersDisliked
  if (usersDisliked.includes(userId)) return
  usersDisliked.push(userId)
  sauce.dislikes++
}

function resetVote(sauce, userId, res) {
  const { usersLiked, usersDisliked} = sauce
  if ([usersLiked, usersDisliked].every(arr => arr.includes(userId))) return 
  if (![usersLiked, usersDisliked].some(arr => arr.includes(userId))) return

  const votesToUpdate = usersLiked.includes(userId) ? usersLiked : usersDisliked

  let arrayToUpdate = usersLiked.includes(userId) ? usersLiked : usersDisliked
  const arrayWithoutUser = arrayToUpdate.filter(id => id !==userId)
  arrayToUpdate = arrayWithoutUser
}