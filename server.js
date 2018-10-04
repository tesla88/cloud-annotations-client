const express = require('express')
const path = require('path')
const request = require('superagent')
const requests = require('request')
const cookieParser = require('cookie-parser')

const app = express()
const port = process.env.PORT || 9000

app.use(cookieParser())
app.use('/static', express.static(path.join(__dirname, 'static')))

app.get('/api/auth', function(req, res) {
  const apikey = req.query.apikey
  request
    .post('https://iam.bluemix.net/oidc/token')
    .query({
      apikey: apikey,
      response_type: 'cloud_iam',
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey'
    })
    .then(respose => {
      res
        .cookie('token', respose.body.access_token, {
          expire: respose.body.expiration
        })
        .sendStatus(respose.status)
    })
    .catch(err => {
      res.sendStatus(err.status)
    })
})

app.get('/api/buckets', function(req, res) {
  const token = req.cookies.token
  request
    .get(`https://s3-api.us-geo.objectstorage.softlayer.net`)
    .set('Authorization', 'bearer ' + token)
    .set(
      'ibm-service-instance-id',
      'crn:v1:bluemix:public:cloud-object-storage:global:a/19552f679a1f1feba412927e04b32553:23ae42fb-ae1f-4f63-b6fa-d0c27e2d59e7::'
    )
    .buffer()
    .type('xml')
    .then(respose => {
      res.send({ xml: respose.text })
    })
    .catch(err => {
      if (err.status === 403) {
        res.clearCookie('token').sendStatus(err.status)
      }
      res.sendStatus(err.status)
    })
})

app.get('/api/list/:bucket', function(req, res) {
  const token = req.cookies.token
  request
    .get(
      `https://s3-api.us-geo.objectstorage.softlayer.net/${req.params.bucket}`
    )
    .set('Authorization', 'bearer ' + token)
    .buffer()
    .type('xml')
    .query({
      'list-type': '2'
    })
    .then(respose => {
      res.send({ xml: respose.text })
    })
    .catch(err => {
      if (err.status === 403) {
        res.clearCookie('token').sendStatus(err.status)
      }
      res.sendStatus(err.status)
    })
})

app.get('/api/fetch/:bucket/:object', function(req, res) {
  const token = req.cookies.token
  var url = `https://s3-api.us-geo.objectstorage.softlayer.net/${
    req.params.bucket
  }/${req.params.object}`
  req
    .pipe(
      requests.get({
        url: url,
        headers: {
          Authorization: 'bearer ' + token
        }
      })
    )
    .pipe(res)
})

app.put('/api/upload/:bucket/:object', function(req, res) {
  const token = req.cookies.token
  var url = `https://s3-api.us-geo.objectstorage.softlayer.net/${
    req.params.bucket
  }/${req.params.object}`
  req
    .pipe(
      requests.put({
        url: url,
        headers: {
          Authorization: 'bearer ' + token
        }
      })
    )
    .pipe(res)
})

app.delete('/api/delete/:bucket/:object', function(req, res) {
  const token = req.cookies.token
  var url = `https://s3-api.us-geo.objectstorage.softlayer.net/${
    req.params.bucket
  }/${req.params.object}`
  req
    .pipe(
      requests.delete({
        url: url,
        headers: {
          Authorization: 'bearer ' + token
        }
      })
    )
    .pipe(res)
})

if (process.env.NODE_ENV === 'production') {
  app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'index.html'))
  })
}

app.listen(port)
