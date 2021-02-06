function setCookie(key, value, expiry) {
  var expires = new Date();
  expires.setTime(expires.getTime() + (expiry * 24 * 60 * 60 * 1000));
  document.cookie = key + '=' + value + ';expires=' + expires.toUTCString();
}

function getCookie(key) {
  var keyValue = document.cookie.match('(^|;) ?' + key + '=([^;]*)(;|$)');
  return keyValue ? keyValue[2] : null;
}

function eraseCookie(key) {
  var keyValue = getCookie(key);
  setCookie(key, keyValue, '-1');
}

var domain = "http://api.offbeat.today";
var profile = {};
var access_token = "";
var headers = {};

function aftersignin() {
  profile = JSON.parse(getCookie("profile"));
  access_token = getCookie("access_token");
  if (access_token && profile) {
    $("#no-signin").hide();
    $("#signin").show();
    $("#signin").html("<span>Hi, " + profile.first_name + " " + profile.last_name + "</span>");
    headers = {
      "Authorization": "Bearer " + access_token
    };
  }
}

function register() {
  var tmp = location.protocol + "%2F%2F" + location.host;
  location.replace("https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&include_granted_scopes=true&response_type=token&state=google&redirect_uri=" + tmp + "&client_id=1077096905229-0jcq0ua0onammjk3idcemoblbt6aiqkm.apps.googleusercontent.com&flowName=GeneralOAuthFlow");
}


$(function () {
  $("#signin").hide();
  var token = Object.fromEntries(new URLSearchParams(location.hash));
  if (token.access_token) {
    $.post(domain + "/auth/google/",
      {
        token: token.access_token
      },
      function (data, status) {
        if (data.access_token) {
          setCookie("profile", JSON.stringify(data.profile), 1);
          setCookie("access_token", data.access_token, 1);
          aftersignin();
        }
      });
  }
  $('a').each(function () {
    if ($(this).prop('href') == window.location.href) {
      $(this).addClass('active'); $(this).parents('li').addClass('active');
    }
  });
  aftersignin();
});


function eventRegister(i, fee) {
  if (getCookie("access_token") == "") {
    if (confirm("To continue you need to login with Google!")) {
      register();
    }
  } else {
    if (fee == 0) {
      $.ajax({
        method: "post",
        url: domain + "/event/" + i + "/register/",
        headers: headers,
      }).done(function (data, status) {
        location.reload();
      }); 
    }
  }
}


function quizRegister(i, fee) {
  if (getCookie("access_token") == "") {
    if (confirm("To continue you need to login with Google!")) {
      register();
    }
  } else {
    if (fee == 0) {
      $.ajax({
        method: "post",
        url: domain + "/competition/" + i + "/register/",
        headers: headers,
      }).done(function (data, status) {
        location.reload();
      }); 
    } else {
    }
  }
}


function events() {
  aftersignin();
  $.ajax({
    url: domain + "/event/",
    headers: headers,
  }).done(function (data, status) {
    var events_content = '';
    data.forEach(function (event) {
      events_content = '<div class="event-block">';
      events_content += '<h3>' + event.name + '</h3><br>';
      for (i = 0; i < event.about.length; ++i) {
        events_content += '<p>' + event.about[i] + '</p><br>';
      }
      let s = new Date(event.start_time);
      let e = new Date(event.end_time);
      events_content += '<p><strong>Event Date: </strong> &nbsp;' + s.getDate() + '-' + s.getMonth() + '-' + s.getFullYear() + '</p>';
      events_content += '<p><strong>Event Timings: </strong> &nbsp;' + s.getHours() + ':' + s.getMinutes() + " to " +  e.getHours() + ':' + e.getMinutes() + '</p>';
      events_content += '<p><strong>Fees: </strong> &nbsp;' + event.fee + '</p>';
        events_content += '<button class="btn btn-info" onclick="eventRegister(' + event.id + ', ' + event.fee + ');" ' + ((event.registered) ? "disabled":"") + '>Register' + ((event.registered) ? "ed":"") + '</button>';
      events_content += '<button class="btn btn-info" onclick="location.href=\'/event.html?q=' + event.id + '\'" style="float: right;">About Event</button>';
      events_content += '</div>';
    });
    $("#event-page").html(events_content);
  })
}


function questions() {
  aftersignin();
  var e = Object.fromEntries(new URLSearchParams(location.search));
  var events_content = '<div class="event-block">';
  if (e["competition"]) {
    $.ajax({
      url: domain + "/competition/" + e["competition"] + "/questions/",
      headers: headers,
    }).done(function (data, status) {
      data.forEach(function (question) {
        console.log(question);
      });
    });
  } else {
    location.href = "/events.html";
  }
}


function event_page() {
  aftersignin();
  var e = Object.fromEntries(new URLSearchParams(location.search));
  console.log(e);
  if (e["q"]) {
    $.ajax({
      url: domain + "/event/" + e["q"] + "/",
      headers: headers,
    }).done(function (data, status) {
      var event_content = '<div class="event-block">';
      event_content += '<h3>' + data.name + '</h3><br>';
      for (i = 0; i < data.about.length; ++i) {
        event_content += '<p>' + data.about[i] + '</p><br>';
      }
      let s = new Date(data.start_time);
      let e = new Date(data.end_time);
      event_content += '<p><strong>Event Date: </strong> &nbsp;' + s.getDate() + '-' + s.getMonth() + '-' + s.getFullYear() + '</p>';
      event_content += '<p><strong>Event Timings: </strong> &nbsp;' + s.getHours() + ':' + s.getMinutes() + " to " +  e.getHours() + ':' + e.getMinutes() + '</p>';
      event_content += '<p><strong>Fees: </strong> &nbsp;' + data.fee + '</p>';
      event_content += '<button class="btn btn-info" onclick="eventRegister(' + data.id + ', ' + data.fee + ');" ' + ((data.registered) ? "disabled":"") + '>Register' + ((data.registered) ? "ed":"") + '</button>';
      event_content += '</div>';
      event_content += '<h2>Competition List:</h2>';
      for (i = 0; i < data.comp.length; ++i) {
        event_content += '<div class="event-block">';
        event_content += '<h3>' + (i+1) + '. ' + data.comp[i].name + '</h3><br>';
        for (j = 0; j < data.comp[i].about.length; ++j) {
          event_content += '<p>' + data.comp[i].about[j] + '</p><br>';
        }
        let s = new Date(data.comp[i].start_time);
        let e = new Date(data.comp[i].end_time);
        event_content += '<p><strong>Event Date: </strong> &nbsp;' + s.getDate() + '-' + s.getMonth() + '-' + s.getFullYear() + '</p>';
        event_content += '<p><strong>Event Timings: </strong> &nbsp;' + s.getHours() + ':' + s.getMinutes() + " to " +  e.getHours() + ':' + e.getMinutes() + '</p>';
        event_content += '<p><strong>Fees: </strong> &nbsp;' + ((data.comp[i].fee.paid) ? data.comp[i].fee.fees : 0) + '</p>';
        if (data.registered)
          event_content += '<button class="btn btn-info" onclick="quizRegister(' + data.comp[i].id + ', ' + ((data.comp[i].fee.paid) ? data.comp[i].fee.fees : 0) + ');" ' + ((data.comp[i].registered) ? "disabled":"") + '>Register' + ((data.comp[i].registered) ? "ed":"") + '</button>';
        var flag = false;
        if (data.comp[i].start_time < new Date() < data.comp[i].end_time)
          flag = true;
        if (data.comp[i].registered)
          event_content += '<button class="btn btn-info" onclick="location.href=\'/quiz.html?competition=' + data.comp[i].id + '\'" style="float: right;" ' + ((flag) ? "disabled":"") + '>GoTo Quiz</button>'
        event_content += '</div>';
      }
      $("#event-page").html(event_content);
    })
  } else {
    location.href = "/events.html";
  }
}