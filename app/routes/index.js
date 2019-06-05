var express = require('express');
var router = express.Router();
var authHelper = require('../helpers/auth.js');
var Holidays = require('date-holidays')
var hd = new Holidays();

/* GET home page. */
router.get('/', async function(req, res, next) {
  let parms = { title: 'Home', active: { home: true } };
  hd.getStates('PL');

  const accessToken = await authHelper.getAccessToken(req.cookies, res);
  const userName = req.cookies.graph_user_name;

  if (accessToken && userName) {
    parms.user = userName;
    parms.debug = `User: ${userName}\nAccess Token: ${accessToken}`;
  } else {
    parms.signInUrl = authHelper.getAuthUrl();
    parms.debug = parms.signInUrl;
  }

  res.render('index', parms);
});

router.get('/shared-calendars', function(req, res) {
  let params = {title: 'Calendar'};
  res.render('calendars', params);
});

module.exports = router;