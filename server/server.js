const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const config = require('./config/config').get(process.env.NODE_ENV);
const app = express();

mongoose.Promise = global.Promise;
mongoose.connect(config.DATABASE);

const { User } = require('./models/user');
const { Book } = require("./models/book");
const { auth } = require("./middleware/auth");
app.use(bodyParser.json());
app.use(cookieParser());

//GET 
app.get('/api/getBook', (req, res) => {
    let id = req.query.id;
    Book.findById(id, (err, doc) => {
        if (err) res.status(400).send(err);
        res.send(doc);
    })
})

app.get('/api/books', (req, res) => {

    let skip = parseInt(req.query.skip);
    let limit = parseInt(req.query.limit);
    let order = req.query.order;

    Book.find().skip(skip).sort({ _id: order }).limit(limit).exec((err, doc) => {
        if (err) res.status(400).send(err);
        res.send(doc);
    })
});


//get reviewer username and lastname using id
app.get('/api/getReviewer', (req, res) => {
    var id = req.query.id;
    User.findById(id, (err,doc) => {
        if (err) return res.status(400).send(err);
        res.json({
            name: doc.name,
            lastname: doc.lastname
        });
    })
})
// log out user

// auth is a middleware used. it will be runing before callback to check if token  is correct/valid and user is loggedin and it exists
app.get('/api/logout', auth, (req, res) => {
    //res.send(req.user);
    req.user.deleteToken(req.token, (err,user) => {
        if (err) return res.status(400).send(err);
        res.sendStatus(200);
    });

});
 
//check if user is logged in order to authenticate user while accessing differnt section
app.get('/api/auth', auth, (req, res) => {
    res.json({
        isAuth: true,
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        lastname:req.user.lastname
        
     })
});

//get all users
app.get('/api/users', (req, res) => {
    User.find({}, (err,users) => {
        if (err) return res.status(400).send(err);
        res.status(200).json(users);
  })
});

//get all post by a user - fetch books using ownerid equals user id

app.get('/api/user_posts', (req, res) => {
    Book.find({ ownerId: req.query.user }).exec((err, docs) => {
        if (err) return res.status(400).send(err);
        res.status(200).json(docs);
    })
})
//POST
app.post('/api/book', (req,res) => {
    const book = new Book(req.body);
    book.save((err, doc) => {
        if (err) res.status(400).send(err);

        res.status(200).json({
            post: true,
            bookId: doc._id
        });
    })
})

app.post("/api/register", (req, res) => {

  const user = new User(req.body);
  user.save((err, doc) => {
    if (err) res.status(400).json({post:false});

    res.status(200).json({
      post: true,
      user: doc,
    });
  });
});

app.post("/api/login", (req, res) => {
    User.findOne({ 'email': req.body.email }, (err,user) => {
        if (!user) return res.json({ isAuth: false, message: "Auth failed. User doesnt exist!" })
        
        //once user existe, we need to compare password that is entered
        //for that we will write a method in userschema
        // here the user is usr and not User
        user.comparePassword(req.body.password, (err, isMatch) => {
          if (!isMatch)
            return res.json({
              isAuth: false,
              message: "User passwords doesnt match",
            });
        });

        // generate token and return user with new token
        user.generateToken((err, user) => {
            if (err) return res.status(200).send(err)
            //create cookie for authentication and also create json response
            res.cookie('auth', user.token).json({
                isAuth: true,
                id: user._id,
                email:user.email
            });
        })
   })
});

//DELETE 
app.delete('/api/delete_book', (req,res) => {
    let id = req.query.id;
    Book.findByIdAndRemove(id, (err, doc) => {
        if (err) res.status(400).send(err);
        res.json(true);
    })
});

//UPDATE

app.post('/api/book_update', (req, res) => {
    Book.findByIdAndUpdate(req.body._id, req.body, { new: true }, (err,doc) => {
        if (err) res.status(400).send(err);
        res.status(200).json({
            success: true,
            doc
        });
    })
});
const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`SERVER RUNNING`);
})