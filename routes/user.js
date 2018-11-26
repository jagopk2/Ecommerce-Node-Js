var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var passport = require('passport');
var Order = require('../models/order');
var Cart = require('../models/cart');
var csrfProtection = csrf();
router.use(csrfProtection);

router.get('/logout', isLoggedIn, function (req, res, next) {
    req.logout();
    // req.session.cart = null;
    res.redirect('/');
})

router.get('/profile', isLoggedIn, function (req, res, next) {
    Order.find({user:req.user},function(err,orders){
        if(err){
           return console.log('cannot Fetch Orders from Mongo Db');
        }
        var cart;
        orders.forEach(function(order){
            cart = new Cart(order.cart);
            order.item = cart.generateArray();
        });
        res.render('user/profile',{orders:orders});
    });
   
});


router.use('/', notLoggedIn, function (req, res, next) {
    next();
});
router.get('/signup', function (req, res, next) {
    var messages = req.flash('error');
    res.render('user/signup', {
        csrfToken: req.csrfToken(),
        messages,
        hasErrors: messages.length > 0
    });
});
router.post('/signup', passport.authenticate('local.signup', {
    
    failureRedirect: '/user/signup',
    failureFlash: true
}),function (req,res,next) {
    if(req.session.oldUrl){
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
    }else{
        res.redirect('/');
    }
});
router.get('/signin', function (req, res, next) {
    var messages = req.flash('error');
    res.render('user/signin', {
        csrfToken: req.csrfToken(),
        messages,
        hasErrors: messages.length > 0
    });
});

// router.post('/signin', function (req, res) {
//     console.log(req.body);
//     res.setHeader('Content-Type', 'application/json');
//     res.send(JSON.stringify(req.body));
// });
router.post('/signin', passport.authenticate('local.signin', {
    
    failureRedirect: '/user/signin',
    failureFlash: true
}),function (req,res,next) {
    if(req.session.oldUrl){
        var oldUrl = req.session.oldUrl;
        req.session.oldUrl = null;
        res.redirect(oldUrl);
    }else{
        res.redirect('/user/profile');
    }
});


module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

function notLoggedIn(req, res, next) {
    if (!req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}