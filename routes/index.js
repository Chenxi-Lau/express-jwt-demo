/*
 * @Author: 刘晨曦
 * @Date: 2021-03-18 10:04:01
 * @LastEditTime: 2021-03-18 11:20:32
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \node-jwt-demo\express-based\routes\index.js
 */
var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' })
})

module.exports = router
