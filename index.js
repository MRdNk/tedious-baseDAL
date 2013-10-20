var tedious     = require('tedious')
var Connection  = tedious.Connection
var Request     = tedious.Request
var TYPES       = tedious.TYPES

var BaseDAL = function (properties) {

  /* Ensure / force an instance rather than a singleton */
  if (!(this instanceof BaseDAL)) return new BaseDAL(properties)

  var self = this
  var that = {}

  self._connString = ''
  self._connection = null
  self._request = null
  self._rows = []
  self._callback = null

  /* private method that creates the connection to the database & handles the connection events (infoMessage, errorMessage) */
  self.createNewConnection = function (cb) {
    var conn = self._connection
    if (self._connString === null) {
      cb(new Error('ConnectionString not set'))
      return;
    }
    conn = new Connection(self._connString)
    conn.on('connect', function (err) {
      if (err) cb(err)
      else cb(null, 'ok')
    })

    conn.on('infoMessage', function (info) {
      console.info(info)
    })
    
    conn.on('errorMessage', function (err) {
      // console.error(err)
      // cb(err)
      self._callback(err)
    })
    self._connection = conn
  }

  /* private method to create the actual request function */
  self.request = function (spName, params, cb) {
    self._callback = cb
    // console.log('self.request')
    if (self._connection === null) {
      cb(new Error('Connection not established in self.request'))
      return;
    }
    if (spName === '') {
      cb(new Error('Stored Procedure name (spName) is an empty string'))
      return;
    }

    var req = new Request(spName, function (err) {
      if (err) {
        cb(err)
        return;
      }
      
    })

    self._request = req
    self.addHandlers(req)
    self.addParams(params)
    
  }

  /* private method for adding sql params to the request */
  self.addParams = function (params) {
    // console.log('addParams [params]: ', params)
    var req = self._request
    for (var i=0; i<params.length; i++) {
      var param = params[i]
      // console.log('param: ',param)
      req.addParameter(param.name, param.type, param.value)
    }
    self._request = req
    self._connection.callProcedure(self._request)

  }

  /* addHandlers: event handlers for row and doneProc events */
  self.addHandlers = function (req) {
    var req = req || self._request
    req.on('row', function (columns) {
      var items = {}
      columns.forEach(function (column) {
        items[column.metadata.colName] = column.value
      })
      self._rows.push(items)
    })

    req.on('doneProc', function (rowCount, more, returnStatus) {
      // console.log('returnStatus: ', returnStatus)
      self._connection.close()
      self._callback(null, {rows: self._rows, returnValue: returnStatus})
    })
  }

  /* public method for adding a Connection String */
  that.ConnectionString = function (connectionstring) {
    self._connString = connectionstring
  }

  /* public method for executing a stored procedure that returns a dataset */
  that.ExecuteSPDataset = function (spName, params, cb) {
    self._callback = cb
    self.createNewConnection(function (err, status) {
      if (err) {
        cb(err)
        return;
      }
      self.request (spName, params, cb)
    })

  }

  return that
}

module.exports = BaseDAL