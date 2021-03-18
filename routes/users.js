/*
 * @Author: your name
 * @Date: 2021-03-18 10:04:01
 * @LastEditTime: 2021-03-18 14:51:44
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \node-jwt-demo\express-based\routes\users.js
 */
var express = require('express')
var router = express.Router()

const crypto = require('crypto')
const tokens = require('../utils/tokens')
const usersModel = require('../models/users')

/* GET users listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource')
})

// User Login
router.post('/login', async function (req, res, next) {
  const params = req.query
  if (!params.userName || !params.password) {
    return res.json({
      code: '000002',
      msg: '参数不合法',
      data: []
    })
  }
  // 数据库查找用户是否存在
  const result = await usersModel.findAll({
    where: {
      userName: params.userName,
      password: crypto.createHash('md5').update(params.password).digest('hex')
    }
  })
  if (result.length) {
    // 通过jsonwebtoken中间件制作token
    const token = await tokens.generate(result[0].userName, result[0].userId)
    return res.json({
      code: '0',
      msg: 'SUCCESS',
      data: {
        userInfo: result[0],
        token
      }
    })
  } else {
    return res.json({
      code: '000002',
      msg: '用户名或密码错误',
      data: []
    })
  }
})

// getUser
router.post('/getUser', function (req, res, next) {
  if (req.data) {
    return res.json({
      code: '0',
      msg: '身份验证成功',
      data: {
        userName: req.data.name,
        userId: req.data._id
      }
    })
  } else {
    return res.json({
      code: '-1',
      msg: '未获取到用户信息',
      data: null
    })
  }
})

module.exports = router
