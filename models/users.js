/*
 * @Author: your name
 * @Date: 2021-03-18 11:22:25
 * @LastEditTime: 2021-03-18 14:06:33
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \node-jwt-demo\express-based\models\users.js
 */
const db = require('../db.config.js')
const Sequelize = require('sequelize')

let usersModel = db.define(
  'users', // 数据库对应的表
  {
    userId: {
      type: Sequelize.STRING(32),
      primaryKey: true // 主键
    },
    userName: Sequelize.STRING(32),
    password: Sequelize.STRING(50)
  },
  {
    timestamps: false // 关闭Sequelize的自动添加timestamp的功能
  }
)
module.exports = usersModel
