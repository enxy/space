const express = require('express');
const router = express.Router();
const authHelper = require('../helpers/auth');

const lib = require('../helpers/lib');
const graph = require('@microsoft/microsoft-graph-client');

router.get('/:month/:year', async function(req, res) {
  let parms = {title: 'Calendar', active: { calendar: true }};
  // set response headers
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  const accessToken = await authHelper.getAccessToken(req.cookies, res);
  const userName = req.cookies.graph_user_name;

    if (accessToken && userName) {
      parms.user = userName;
      // Initialize Graph client
      const client = graph.Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        }
    });

    const start = new Date(new Date(req.params.year + "-" + req.params.month + "-10").setHours(0,0,0));
    const end = new Date(new Date(start).setDate(start.getDate() + 20));
    let dateScope = lib.getShortTermPeriod(parseInt(req.params.month));
    console.log(dateScope);
    try {
        let shared_calendars = await client.api('/me/calendars').get();
        let promises = [];

        shared_calendars.value.forEach(calendar => {
            promises.push(getData(client, calendar.id, start, end));
        });
        // wait till all promises are resolved!
        Promise.all(
          promises
        ).then(resp => {
          let events = {}, attend = {}, index = 0;
          var timeline_absences = [];
         
          shared_calendars.value.forEach(calendar=>{
              events[calendar.owner.address] = [];
              attend[calendar.owner.address] = {};

              if (calendar.owner.address.localeCompare(lib.app_owner_email)) {
                  let owner_events =  resp[index].value;
                  owner_events.forEach(event=>{
                      if (lib.absence_types.indexOf(event.showAs)>-1) {
                          var absence = lib.addNewAbsence(calendar, event, req.params.month);     
                          timeline_absences.push(absence);  
                       }
                  });
                  if (dateScope.prev || dateScope.next) {
                      owner_events.forEach(event=>{
                          let eventStart = new Date(event.start.dateTime).getDate();
                          console.log(dateScope.prev <= eventStart);
                          console.log(eventStart<= dateScope.next);
                          //console.log(dateScope.prev <= eventStart && eventStart<= dateScope.next);
                          console.log(eventStart);
                          if (dateScope.prev <= eventStart && eventStart<= dateScope.next) {
                              if (lib.reg.test(event.subject)) {
                                  lib.addAttendance(attend[calendar.owner.address], event);
                              }
                          }
                      });
                  }
              }
              //console.log(attend[calendar.owner.address]);
              if (Object.keys(attend).length) {
                  lib.addNotAllocatedDays(attend[calendar.owner.address], calendar, 
                                      timeline_absences, req.params.month, req.params.year);
                  
              }

              
              index++;
          });

          res.send(timeline_absences);
      })} catch (err) {
          parms.message = 'Error retrieving events';
          parms.error = { status: `${err.code}: ${err.message}` };
          parms.debug = JSON.stringify(err.body, null, 2);
          res.render('error', parms);
      }
  } else {
    // Redirect to home
    res.redirect('/');
  }
});

async function getData(client, calendar_id, start, end) {
  return await client
       .api(`me/Calendars('` + calendar_id + `')/calendarView?startDateTime=${start.toISOString()}&endDateTime=${end.toISOString()}`)
       .top(1000)
       .select('subject,start,end,showAs')
       .orderby('start/dateTime DESC')
       .get(); 
}

router.get('/shared', async function(req, res) {
    let params = {title: 'Calendar', active: { calendar: true }};
    res.render('calendars', params);
});


module.exports = router;