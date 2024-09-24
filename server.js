require('dotenv').config();

//Import dependencies
const express = require("express")
const mysql = require('mysql')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { json } = require("body-parser")

const app = express() //express server function
const port = 3000 //express server port

//Middleware
app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(express.static('public'))
app.use(cookieParser())

//API routes
app.get('/agent', (req, res)=>{
    res.render('agentlog.ejs', {error: ""})
})
app.get('/agent/dashboard', (req, res)=>{
    if(req.cookies.jwt){
        const verify = jwt.verify(req.cookies.jwt,
          'mzow8ajk672928hsuuaomlafhjkkcmpwiajaui4783gtoeueee')
        res.render("agentdashboard.ejs", {username:verify.username})
      }
      else{
        res.redirect('/agent')
      }
})
app.get('/agent/dashboard/new_lead', (req, res)=>{
  if(req.cookies.jwt){
    const verify = jwt.verify(req.cookies.jwt,
      'mzow8ajk672928hsuuaomlafhjkkcmpwiajaui4783gtoeueee')
    res.render("newlead.ejs",{message: ""})
  }else{
    res.redirect('/agent/dashboard')
  }
})
app.get('/logout', (req, res)=>{
    res.cookie("jwt", "", {maxAge: 1})
    res.redirect('/agent')
})

//End API routes


//Agent Login Authentication
app.post('/agent', (req, res)=>{
    const user = {
        username: process.env.userAgent,
        password: process.env.userAgentPassword
    }
    const token = jwt.sign({username: user.username}, 
        'mzow8ajk672928hsuuaomlafhjkkcmpwiajaui4783gtoeueee')
      res.cookie('jwt', token,{
        maxAge: 600000,
        httpOnly: true
      })
    const databaseConnection = mysql.createConnection({
        user: req.body.username,
        password: req.body.password,
        database: 'mydatabase',
        host: 'localhost',
        port: 3307
    })
    databaseConnection.connect((err)=>{
        if(err){
            console.log(err)
            const error = "Access Denied!!!"
            res.render("agentlog.ejs", {error})
        }
        else{
              res.cookie('jwt', token,{
                maxAge: 600000,
                httpOnly: true
              })
              res.redirect('/agent/dashboard')
        }
    })
})

//Add new lead
app.post('/new_lead', (req, res)=>{
  const databaseConnection = mysql.createConnection({
    user: process.env.userAgent,
    password: process.env.userAgentPassword,
    database: 'mydatabase',
    host: 'localhost',
    port: 3307
})
databaseConnection.connect((err)=>{
  if(!err){
    databaseConnection.query('select * from leads where Email = ?',
      [req.body.email], (err, result)=>{
      if(!err){
        if(result.length > 0){
          const message = "A lead with the provided email already exist!"
          res.render('newlead.ejs', {message})
        }else{
          const date = new Date()
          const datenow = date.toISOString().slice(0, 10)
          databaseConnection.query
          ('insert into leads(Lead_Detail_Name, Email, \
            Submission_Date, Phone_Number)values(?,?,?,?)',
            [req.body.leadFullName, req.body.email, datenow, req.body.phone],
             (err)=>{
              if(!err){
                const message = "A new lead added successfully"
                res.render('newlead.ejs', {message})
              }
            })
        }
      }
    })
  }
})
})

//Retrieve all leads records
app.get('/agent/dashboard/leads',(req, res)=>{
  const databaseConnection = mysql.createConnection({
    user: process.env.userAgent,
    password: process.env.userAgentPassword,
    database: 'mydatabase',
    host: 'localhost',
    port: 3307
  })
  databaseConnection.connect((err)=>{
    if(!err){
      databaseConnection.query('select * from leads', (err, result)=>{
      if(err) throw err
      res.json(result)
     })
    }
  })

})


app.listen(port, ()=>console.log(`Server is listening to port ${port}`))