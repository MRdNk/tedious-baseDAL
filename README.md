tedious-baseDAL
===============

A Base DAL (data access layer) for tedious (node TDS for SQL Server)

install
-------
```bash
npm install tedious-basedal
```

usage
-----
```javascript

  var BaseDAL = require('tedious-basedal')

  var id = 1

  var dal = new BaseDAL()
  dal.ConnectionString ({
      server  : 'localhost'
    , userName: 'username'
    , password: 'pass'
    , database: 'dbName'
  })

  var _params = []
  _params.push({
    name: 'ID',
    type: TYPES.Int,
    value: id
  })

  dal.ExecuteSPDataset('dbo.usp_GetUserByID', _params, function (err, data) {
    if (err) console.error(err)
    else console.log(data)
    // => data {rows: [{column1: 'value'}], returnValue: 1}
  })
```