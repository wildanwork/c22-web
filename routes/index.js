const { query, json } = require('express');
var express = require('express');
var router = express.Router();
var moment = require('moment');
const { route } = require('./users');
module.exports = function (db) {

  /* GET home page. */
  router.get('/', async function (req, res) {
    try {
      const sortBy = req.query.sortBy || 'Umur'
      console.log(sortBy,"ini sort BY")
      const sortMode = req.query.sortMode || 'asc'
      const url = req.url == '/' ? "/?page=1" : req.url
      const page = req.query.page || 1
      const LIMIT = 5;
      const OFFSET = (page - 1) * LIMIT
      var syntax = await db.collection("mahasiswa").find({}).limit(LIMIT).skip(OFFSET).toArray()

      var command = {

      }
      var order = {

      } 
      order[`${sortBy}`] = `${sortMode == 'asc' ? parseInt(1):parseInt(-1)}`
      
      console.log(order,"ini order")
      // console.log('Found documents =>', rows);
      syntax
      console.log(syntax, "ini syntax")
      if (req.query.inputNama) {
        value = req.query.inputNama
        command['Nama'] = new RegExp(value, "i")
      }
      if (req.query.Umur) {
        command['Umur'] = parseInt(req.query.Umur)
      }
      if (req.query.IP) {
        command['IP'] = parseFloat(req.query.IP)
      }
      if (req.query.Tanggal1) {
        command['date'] = { $gt: new Date(`${req.query.Tanggal1}`)}
      } else if (req.query.Tanggal1 && req.query.Tanggal2){
        command['date'] = { $gt: new Date(`${req.query.Tanggal1}`),
        $lt:new Date(`${req.query.Tanggal2}`)}
      } else if (req.query.Tanggal2){
        command['date'] = { $lt: new Date(`${req.query.Tanggal2}`)}
      }
      if (req.query.Status) {
        command['Status'] = JSON.parse(req.query.Status)
      }
      console.log(command, "ini command")
      var rows = await db.collection("mahasiswa").find(command).toArray();
      syntax = await db.collection("mahasiswa").find(command).limit(LIMIT).skip(OFFSET).sort(order).toArray()
      const pages = Math.ceil(rows.length / LIMIT)

      res.render('list', { rows, moment, syntax, page, OFFSET, query: req.query, url, pages, item: rows[0] });

    } catch (err) {
      console.log(err, "gabisa ambil data")
    }

  });

  router.get('/add', (req, res) => {
    res.render('add')
  })
  router.post('/add', (req, res) => {
    console.log(req.body)
    db.collection("counters").findOneAndUpdate({ _id: 'NIM' },
      { $inc: { sequence_value: 1 } },
      { new: true }).then((result) => {
        console.log(result)
        var myobj = {
          _id: result.value.sequence_value,
          Nama: req.body.Nama,
          Umur: parseInt(req.body.Umur),
          IP: parseFloat(req.body.IP),
          date: new Date(`${req.body.Tanggal1}`),
          Status: JSON.parse(req.body.Status)
        };
        db.collection("mahasiswa").insertOne(myobj, function (err, res) {
          if (err) throw err;
          console.log("1 document inserted");

        });
        res.redirect('/')
      }
      ).catch((err) => {
        console.log(err)
      })


  })
  router.get('/edit/:NIM', async function (req, res) {
    try {
      const item = await db.collection('mahasiswa').find({ _id: parseInt(req.params.NIM) }).toArray();
      // console.log('Found documents filtered by { nim } =>', item);
      res.render('edit', { item: item[0], moment })
    } catch (err) {
      console.log('ini error', err)
    }
  })
  router.post('/edit/:NIM', async function (req, res) {
    try {
      const { Nama, Umur, IP, Status } = req.body
      const date = req.body.Tanggal1

      const updateResult = await db.collection('mahasiswa').updateOne({ _id: parseInt(req.params.NIM) }, { $set: { Nama, Umur: parseInt(Umur), IP: parseFloat(IP), date: new Date(`${date}`), Status: JSON.parse(Status) } });
      console.log('Updated documents =>', updateResult);
      res.redirect('/')
    } catch (err) {
      console.log('error edit', err)
    }
  })
  router.get('/delete/:NIM', async function (req, res) {
    try {
      const page = req.query.page || 1
      console.log(req.params.page)
      console.log(req.params.NIM, 'ini req nim')
      const index = req.params.NIM
      const deleteResult = await db.collection("mahasiswa").deleteMany({ _id: parseInt(index) });
      res.redirect(`/?page=${page}`)
    }
    catch (err) {
      console.log("ini error delete", err)
    }

  })
  return router;
}