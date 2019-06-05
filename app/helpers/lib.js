const absence_types = ["ooo", "unknown", "oof"];
const reg = new RegExp(/^(\d)+ *(\.|,|h|min|m)+ *(\d)* *(\.|,|h|min|m)*$/i);
const app_owner_email = 'jolanta.plewa@nokia.com';
const bd = require('business-days');

function isWeekday(year, month, day) {
    var day = new Date(year, month-1, day).getDay();
    return day!=0 && day!=6;
}

function getNumberOfDaysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
};

function getWeekdaysInMonth(month, year) {
      var stop = getNumberOfDaysInMonth(month, year);
      var weekdays = [], today = new Date().getDate();

      if ((month-1) == new Date().getMonth() && year == new Date().getFullYear())
          stop = (new Date(Date.now() + 12096e5).getMonth() == month-1) ? new Date(Date.now() + 12096e5).getDate() : stop; 

      for(var i=1; i<=stop; i++) {
          var wday = new Date(year, month-1, i);
          if (isWeekday(year, month, i)) { 
              var y = wday.getFullYear(), 
              m = (wday.getMonth() < 10) ? "0"+(wday.getMonth()+1) : wday.getMonth(),
              d = (wday.getDate() < 10) ? "0"+ wday.getDate() : wday.getDate();

              weekdays.push([y, m, d].join('-'));
          }
      }

      return weekdays;
}

function addNewAbsence(calendar, event, month) {
    absence = {};
    let startDatetime = new Date(event.start.dateTime);
    let endDatetime = new Date(event.end.dateTime);

    absence.title = calendar.owner.address + " - " +event.showAs;
    absence.start = (startDatetime.getMonth()+1 < month) ? "1" : startDatetime.getDate();
    absence.end = (endDatetime.getMonth() > month) ? "30" : endDatetime.getDate();
    absence.description = event.subject;

    return absence;
}

function addAttendance(attendances, event) {
    var eventDate = event.start.dateTime.split("T")[0];

    if (!(eventDate in attendances)) 
        attendances[eventDate] = [];
    attendances[eventDate].push(event);
}

function getWorkingDays(from, to, month, year) {
    var weekdays = [];

    for(var i=from; i<=to; i++) {
        var wday = new Date(year, month-1, i);
        if (isWeekday(year, month, i)) { 
            var y = wday.getFullYear(), 
            m = (wday.getMonth() < 10) ? "0"+(wday.getMonth()+1) : wday.getMonth(),
            d = (wday.getDate() < 10) ? "0"+ wday.getDate() : wday.getDate();

            weekdays.push([y, m, d].join('-'));
        }
    }

    return weekdays;
}
function addNotAllocatedDays(attendances, calendar, timeline_absences, month, year) {
    var working_days = getWeekdaysInMonth(month, 2019);
    working_days = working_days.filter(x=>!Object.keys(attendances).includes(x));

    working_days.forEach(absc=>{
        absence = {};
        absence.title = calendar.owner.address + " - absent";
        absence.start = absc.split("-")[2]; // day
        absence.end = absc.split("-")[2]; // day
        absence.description = "no calendar allocation";

        if (!isOverlapsing(timeline_absences, absence, calendar)) {
            timeline_absences.push(absence);
        }
    });
}

function isOverlapsing(timeline_absences, absence, calendar) {
    let len = timeline_absences.length;

    for (let i=0; i<len; i++) {
        let abs = timeline_absences[i];
        if (abs.title.split(" - ")[0] == calendar.owner.address) {
            if (parseInt(abs.start) >= parseInt(absence.start) 
                && parseInt(absence.start) <= parseInt(abs.end))  {
                return true;
            }
        }
    };

    return false;  
}

function getPerson(emailAddress) {

    if (emailAddress.split("@")) {
        let fullName = emailAddress.split("@")[0].split('.');
        let abrev = fullName[0].charAt(0).toUpperCase() + ". " + fullName[1].charAt(0).toUpperCase();
        abrev += fullName.slice(1);
        console.log(abrev);
    }
}

function getShortTermPeriod(month=6) {
    let scope = {"prev":0, "next":0};
    let prev_week_date = new Date();
    prev_week_date.setDate(prev_week_date.getDate() - 7);

    let next_week_date = new Date();
    next_week_date.setDate(next_week_date.getDate() + 7);

    let prevDiff = new Date(prev_week_date).getMonth()+1 - parseInt(month);
    let nextDiff = new Date(next_week_date).getMonth()+1 - parseInt(month);
    
    if ( prevDiff == 0) {    
        scope.prev = prev_week_date.getDate();
    } else if ( nextDiff == -1) {
        scope.prev =  new Date(new Date().getFullYear(), new Date().getMonth()+1, 1).getDate();
    }

    if ( nextDiff == 0) {    
        scope.next = next_week_date.getDate();
    } else if ( nextDiff == 1) {
        scope.next =  new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
    }
            
    return scope;
}

exports.absence_types = absence_types;
exports.reg = reg;
exports.app_owner_email = app_owner_email;

exports.addNewAbsence = addNewAbsence;
exports.addAttendance = addAttendance;
exports.getShortTermPeriod = getShortTermPeriod;
exports.addNotAllocatedDays = addNotAllocatedDays;
exports.getShortTermPeriod = getShortTermPeriod