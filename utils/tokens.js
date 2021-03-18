/*
 * @Author: 刘晨曦
 * @Date: 2021-03-18 14:10:55
 * @LastEditTime: 2021-03-18 14:15:43
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \node-jwt-demo\express-based\utils\token.js
 */
const jwt = require('jsonwebtoken')
const signKey = 'express_jwt_key'

// jwt.sign(payload, secretOrPrivateKey, [options, callback])

function generate (username, userId) {
  return new Promise((resolve, reject) => {
    const token = jwt.sign({
      name: username,
      _id: userId
    }, signKey, {
      expiresIn: '1h'
    })
    resolve(token)
  })
}

function verify (token) {
  return new Promise((resolve, reject) => {
    const info = jwt.verify(token.split(' ')[1], signKey)
    resolve(info)
  })
}

module.exports = {
  generate, verify
}
