<!--
 * @Author: 刘晨曦
 * @Date: 2021-03-18 10:04:42
 * @LastEditTime: 2021-03-18 16:26:38
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: \node-jwt-demo\express-based\README.md
-->

# 基于 Express.js 的 JWT 鉴权方案的实践

> 方案：Express.js + Mysql2 + sequelize

> Github 项目地址：https://github.com/Chenxi-Lau/express-jwt-demo

关于 JWT 鉴权方案的介绍：
https://chenxi-lau.github.io/docsify-based-wiki/#/project/json-web-token

## 1. 生成 Express.js 项目

```npm
安装生成工具
npm install express-generator -g

生成项目
express express-jwt-demo

进入项目
cd express-jwt-demo

安装依赖
npm install

运行项目
npm start
```

## 2. 和数据库建立连接

```cmd
启动 mysql
net start mysql

登录数据库
mysql -u root -p

执行 SQL 文件
source C:\Desktop\jwt_demo.sql （你的sql文件的路径）
```

这时，数据库里面就有一个名为 jwt_demo 的表，表中有一条测试数据，

| userId            | userName | password                         |
| ----------------- | -------- | -------------------------------- |
| 99170219708121088 | admin    | e10adc3949ba59abbe56e057f20f883e |

表中数据 password 是采用[crypto.js](https://www.npmjs.com/package/crypto-js)中间件 md5 加密后存储的密码，未加密之前的密码为 **123456**。

接着，我们可以采用两个中间件 [sequelize](https://www.npmjs.com/package/sequelize) 与 [mysql2](https://www.npmjs.com/package/mysql2)与数据库建立连接，并将关系数据库的表结构映射到对象上。安装相关依赖，

```npm
npm install sequelize mysql2
```

主目录下新建 db.config.js 用于配置数据库的相关信息

```javascript
const Sequelize = require('sequelize')

const config = {
  host: 'localhost',
  username: 'root',
  password: 'xxxxxxxx',
  database: 'jwt_demo',
}
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: 'mysql',
  pool: {
    max: 5,
    min: 0,
    idle: 30000,
  },
})

module.exports = sequelize
```

主目录下新建 models/users.js，通过 define()将数据库的表结构映射到对象上，

```javascript
const db = require('../db.config.js')
const Sequelize = require('sequelize')

let usersModel = db.define(
  'users', // 数据库对应的表
  {
    userId: {
      type: Sequelize.STRING(32),
      primaryKey: true, // 主键
    },
    userName: Sequelize.STRING(32),
    password: Sequelize.STRING(50),
  },
  {
    timestamps: false, // 关闭Sequelize的自动添加timestamp的功能
  }
)
module.exports = usersModel
```

## 3. 新增 login / getUser 两个接口

在 routes/users.js 中新增一个登陆的接口（/login）和一个根据 Token 获取用户信息的接口（/getUser），

```javascript
const crypto = require('crypto')
const tokens = require('../utils/tokens')
const usersModel = require('../models/users')
// User Login
router.post('/login', async function(req, res, next) {
  // post 请求是放在 req.query 里面的
  const params = req.query
  if (!params.userName || !params.password) {
    return res.json({
      code: '000002',
      msg: '参数不合法',
      data: [],
    })
  }
  // 从数据库查找用户是否存在
  const result = await usersModel.findAll({
    where: {
      userName: params.userName,
      password: crypto
        .createHash('md5')
        .update(params.password)
        .digest('hex'),
    },
  })
  if (result.length) {
    // 通过jsonwebtoken中间件制作token
    const token = await tokens.generate(result[0].userName, result[0].userId)
    return res.json({
      code: '0',
      msg: 'SUCCESS',
      data: {
        userInfo: result[0],
        token,
      },
    })
  } else {
    return res.json({
      code: '000002',
      msg: '用户名或密码错误',
      data: [],
    })
  }
})

// getUser
router.post('/getUser', function(req, res, next) {
  if (req.data) {
    return res.json({
      code: '0',
      msg: '身份验证成功',
      data: {
        userName: req.data.name,
        userId: req.data._id,
      },
    })
  } else {
    return res.json({
      code: '-1',
      msg: '未获取到用户信息',
      data: null,
    })
  }
})
```

其中，utils/tokens 是我们采用 jsonwebtoken 中间件封装的方法，

```javascript
const jwt = require('jsonwebtoken')
const signKey = 'express_jwt_key'

// jwt.sign(payload, secretOrPrivateKey, [options, callback])
function generate(username, userId) {
  return new Promise((resolve, reject) => {
    const token = jwt.sign(
      {
        name: username,
        _id: userId,
      },
      signKey,
      {
        expiresIn: '1h',
      }
    )
    resolve(token)
  })
}

function verify(token) {
  return new Promise((resolve, reject) => {
    const info = jwt.verify(token.split(' ')[1], signKey)
    resolve(info)
  })
}

module.exports = {
  generate,
  verify,
}
```

因为 routes/users.js 里面的路由已经挂载至 app.js 中了，所以不需要手动挂载，这时候访问 /users/login?userName=admin&password=123456 是可以拿到用户数据的。

但是，此时我们还没有做 token 校验的相关处理，/users/getUser 接口是拿不到用户数据的。

## 4. Token 的解析与校验

JWT 方案中，当用户登录成功后，会将/login 接口返回的 token 存储在本地缓存中，在下次需要在 headers 中，服务端要对携带的 token 进行解析，解析成功会返回被加密的信息。其流程如下所示：

![image-20210317203000297](file://C:/Users/liuchenxi/AppData/Roaming/Typora/typora-user-images/image-20210317203000297.png?lastModify=1616055077)

因此，我们还需要对下次请求携带的 token 进行校验，这里可以采用[express-jwt](https://www.npmjs.com/package/express-jwt)中间件进行校验，对异常的错误信息（401 错误）进行捕获。

app.js

```javascript
const tokens = require('./utils/tokens')
const expressJwt = require('express-jwt')
// ! 解析Token获取用户信息
app.use(function(req, res, next) {
  const token = req.headers['authorization']
  if (token == undefined) {
    return next()
  } else {
    tokens
      .verify(token)
      .then((data) => {
        req.data = data
        return next()
      })
      .catch(() => {
        return next()
      })
  }
})

//! 验证 Token 是否过期并设置白名单
app.use(
  expressJwt({
    secret: 'express_jwt_key',
    algorithms: ['HS256'],
  }).unless({
    path: ['/', '/users/', '/users/login'],
  })
)

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  //! catch 401 error
  if (err.name === 'UnauthorizedError') {
    res.status(401)
    res.json({
      code: '-1',
      msg: err.message,
      data: null,
    })
    return
  }
  // render the error page
  res.status(err.status || 500)
  res.render('error')
})
```

## 5. 方案验证

我暂时没有提供客户端的实现，这里直接采用 postman 测试一下功能。首先，进行登录验证 /users/login?userName=admin&password=123456，正确的返回值为:

```json
{
  "code": "0",
  "msg": "SUCCESS",
  "data": {
    "userInfo": {
      "userId": "99170219708121088",
      "userName": "admin",
      "password": "e10adc3949ba59abbe56e057f20f883e"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiYWRtaW4iLCJfaWQiOiI5OTE3MDIxOTcwODEyMTA4OCIsImlhdCI6MTYxNjA0ODQzOCwiZXhwIjoxNjE2MDUyMDM4fQ.BMDsbu2-qPCJOyRJhGfgUsnCfLBuGRragFJSREtTDRk"
  }
}
```

接着，验证 /users/getUser 接口，在未携带 Token 的情况下：

```json
{
  "code": "-1",
  "msg": "No authorization token was found",
  "data": null
}
```

携带不正确 Token 情况下：

```javascript
{
    "code": "-1",
    "msg": "invalid token",
    "data": null
}
```

携带正确的 Token 情况下：

```json
{
  "code": "0",
  "msg": "身份验证成功",
  "data": {
    "userName": "admin",
    "userId": "99170219708121088"
  }
}
```
