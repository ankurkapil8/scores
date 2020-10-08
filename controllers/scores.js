var express = require("express");
const app = express.Router();
const db = require("../config");
const service = require("../db/scores");
const Joi = require('@hapi/joi');
app.post("/create-user", (req, res, next) => {
    try {
      const joiSchema = Joi.object({
        uniqueId: Joi.required().messages({
            'any.required': `"uniqueId" is a required field`
          }),
          imageUrl: Joi.required().messages({
            'any.required': `"imageUrl" is a required field`
          }),
      });  
      const validationResult = joiSchema.validate(req.body, { abortEarly: false });
      if(validationResult.error){
        return res.status(500).json({
          message: validationResult.error.details
        });        
      }         
      service.createUser(req.body).then(result=>{
          return res.status(200).json(result);

      }).catch(err=>{
        return res.status(500).json({
          message: err
        });
      })
    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
  
    }
  
  });

  // find user API
  app.get("/get-user", (req, res, next) => {
    try {
      const joiSchema = Joi.object({
        uniqueId: Joi.required().messages({
            'any.required': `"uniqueId" is a required field`
          })
      });  
      const validationResult = joiSchema.validate(req.body, { abortEarly: false });
      if(validationResult.error){
        return res.status(500).json({
          message: validationResult.error.details
        });        
      }         
      service.getUser(req.query.uniqueId).then((data)=>{
        return res.status(200).json(data);
      }).catch(err=>{
        return res.status(500).json({
          message: err
        });
      })
    } catch (error) {
      //console.log(error);
      return res.status(500).json({
        message: error.message
      });
    }
  });
  // submit new score
  app.post('/submit-score', (req, res, next) => {
    try {
      const joiSchema = Joi.object({
        leaderboardName: Joi.required().messages({
            'any.required': `"leaderboardName" is a required field`
          }),
          score: Joi.number().required().messages({
            'string.base':`"score" should be a type of 'number'`,
            'any.required': `"score" is a required field`,

          }),
          token: Joi.required().messages({
            'any.required': `"token" is a required field`
          })

      });  
      const validationResult = joiSchema.validate(req.body, { abortEarly: false });
      if(validationResult.error){
        return res.status(500).json({
          message: validationResult.error.details
        });        
      }         

      let userUniqueId = req.body.token.split("-");
      let newRow = {
        leaderboardName: req.body.leaderboardName,
        score: req.body.score,
        userUniqueId: userUniqueId[1],
        createdAt: Date.now(),
      }
      service.submitScore(newRow).then(result=>{
        return res.status(200).json(result);
      }).catch(err=>{
        return res.status(500).json({
          message: err
        });
      })
    } catch (error) {
      return res.status(500).json({
        message: error.message
      });
    }
  });
  
  // get top score of perticular leader board
  app.get('/top-score', (req, res, next) => {
    try {
      const joiSchema = Joi.object({
        leaderboardName: Joi.required().messages({
            'any.required': `"leaderboardName" is a required field`
          })
      });  
      const validationResult = joiSchema.validate(req.query, { abortEarly: false });
      if(validationResult.error){
        return res.status(500).json({
          message: validationResult.error.details
        });        
      }         

      service.getTopScore(req.query.leaderboardName).then(data=>{
        return res.status(200).json(data);
      }).catch(err=>{
        return res.status(500).json({ message: err});
      })
    } catch (error) {
      return res.status(500).json({ message: error.message});
    }
  });
  
  app.get('/user-score', (req, res, next) => {
    try {
    const joiSchema = Joi.object({
      leaderboardName: Joi.required().messages({
          'any.required': `"leaderboardName" is a required field`
        }),
        limit: Joi.number().required().messages({
          'string.base':`"limit" should be a type of 'number'`,
          'any.required': `"limit" is a required field`,

        }),
        token: Joi.required().messages({
          'any.required': `"token" is a required field`
        })

    });  
    const validationResult = joiSchema.validate(req.query, { abortEarly: false });
    if(validationResult.error){
      return res.status(500).json({
        message: validationResult.error.details
      });        
    }         
  let uniqueId = req.query.token.split("-");
    let limit = req.query.limit;
    service.getUserScore(req.query.leaderboardName, uniqueId[1],limit).then(data=>{
      return res.status(200).json(data);
    }).catch(err=>{
      return res.status(500).json({ message: err});
    })
    } catch (error) {
      return res.status(500).json({ message: error.message});
    }
  })
  module.exports = app;
  