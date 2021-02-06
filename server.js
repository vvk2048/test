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

function logout() {
  var cookies = document.cookie.split(";");

  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    var eqPos = cookie.indexOf("=");
    var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
  location.href = "/";
}

var domain = "https://api.offbeat.today";
var profile = {};
var access_token = "";
var headers = {};

function aftersignin() {
  profile = JSON.parse(getCookie("profile"));
  access_token = getCookie("access_token");
  if (access_token && profile) {
    $("#no-signin").hide();
    $("#signin").show();
    $("#signin").html("<span>Hi, " + profile.first_name + " " + profile.last_name + "</span><button onClick='logout();'>Log Out</button>");
    headers = {
      "Authorization": "Bearer " + access_token,
      "Content-Type": "application/json"
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

function payment(data) {
  aftersignin();
  var options = {
    "key": "rzp_live_CqdTeLWTnS6Nrk", // Enter the Key ID generated from the Dashboard
    "amount": (data.event.final_fee*100), // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
    "currency": "INR",
    "name": data.event.name,
    "description": "Offbeat Event Registration",
    "image": "https://www.offbeat.today/images/logo.png",
    "order_id": data.order_id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
    "handler": function (response){
      console.log(response);
      $.ajax({
        method: "post",
        url: domain + "/event/" + data.event.id + "/verify/",
        headers: headers,
        data: JSON.stringify({
          "order_id": data.id,
          "razorpay_payment_id": response.razorpay_payment_id,
          "razorpay_order_id": response.razorpay_order_id,
          "razorpay_signature": response.razorpay_signature,
        }),
        dataType: "json"
      }).done(function (data, status) {
        if (data.id) {
          payment(data);
        } else {
          location.reload();
        }
      });
    },
    "prefill": {
      "name": profile.first_name + " " + profile.last_name,
      "email": profile.email
    },
    "notes": {
      "address": "Offbeat News Office"
    },
    "theme": {
      "color": "#3399cc"
    }
  };
  var rzp1 = new Razorpay(options);
  rzp1.on('payment.failed', function (response){
    alert(response.error.code);
    alert(response.error.description);
    alert(response.error.source);
    alert(response.error.step);
    alert(response.error.reason);
    alert(response.error.metadata.order_id);
    alert(response.error.metadata.payment_id);
  });
  rzp1.open();
}


function eventRegister(i, fee) {
  if (getCookie("access_token") == "") {
    if (confirm("To continue you need to login with Google!")) {
      register();
    }
  } else {
    $.ajax({
      method: "post",
      url: domain + "/event/" + i + "/register/",
      headers: headers,
    }).done(function (data, status) {
      if (data.id) {
        payment(data);
      } else {
        location.reload();
      }
    });
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
      events_content += '<div class="event-block">';
      events_content += '<h3>' + event.name + '</h3><br>';
      for (i = 0; i < event.about.length; ++i) {
        events_content += '<p>' + event.about[i] + '</p><br>';
      }
      let s = new Date(event.start_time);
      let e = new Date(event.end_time);
      events_content += '<p><strong>Event Date: </strong> &nbsp;' + s.getDate() + '-' + s.getMonth() + '-' + s.getFullYear() + '</p>';
      events_content += '<p><strong>Event Timings: </strong> &nbsp;' + s.getHours() + ':' + s.getMinutes() + " to " + e.getHours() + ':' + e.getMinutes() + '</p>';
      events_content += '<p><strong>Fees: </strong> &nbsp;' + (event.fee == event.final_fee ? event.fee: "<strike>" + event.fee + "</strike> " + event.final_fee) + '</p>';
      if (event.registered) {
        events_content += '<button class="btn btn-info" disabled>Registered</button>';
      } else if (event.pending) {
        events_content += '<button class="btn btn-info" disabled>Pending Status</button>';
      } else {
        events_content += '<button class="btn btn-info" onclick="eventRegister(' + event.id + ', ' + event.final_fee + ');">Register</button>';
      }
      events_content += '<button class="btn btn-info" onclick="location.href=\'/event.html?q=' + event.id + '\'" style="float: right;">About Event</button>';
      events_content += '</div>';
    });
    $("#event-page").html(events_content);
  })
}


var quiz = Object.fromEntries(new URLSearchParams(location.search)).competition;
var current_question_index = 0;
var question_list = (JSON.parse(getCookie("questions_" + quiz)) || []);
var total_questions = question_list.length;
var answers = (JSON.parse(getCookie("answers_" + quiz)) || {});

function answer_set(j, a) {
  answers[j] = a;
  setCookie("answers_" + quiz, JSON.stringify(answers), 1);
}

function quiz_submit() {
  $.ajax({
    method: "post",
    url: domain + "/competition/" + quiz + "/submission/",
    headers: headers,
    dataType: "json",
    data: JSON.stringify(answers)
  }).done(function (data, status) {
    alert("Thank you for particpating in this quiz!!");
    location.href = "/";
  });
}


function question() {
  var id = question_list[current_question_index]["id"]
  var q = question_list[current_question_index]["question"];

  var events_content = '<div class="quiz-block">';
  events_content += '<h5 class="each-question">' + (current_question_index+1) + '. ' + q.text + '</h5>';

  for (j = 0; j < q.options.length; j++) {
    events_content += '&nbsp &nbsp <input style="margin-bottom:20px;" type="radio" name="' + id + '" value="' + q.options[j] + '" onclick="answer_set(' + id + ',\'' + q.options[j] + '\')" ' + ((answers[id] == q.options[j]) ? "checked":"") + '> &nbsp';
    events_content += q.options[j] + "<br>";
  }

  events_content += '<button class="btn btn-warning" onClick="clearSelection(' + id + ');" id="ExampleTrigger">Clear Selection</button>';
  if (current_question_index == total_questions - 1) {
    events_content += '<button class="btn btn-success" onClick="quiz_submit();" style="float: right;margin-right:10px;">Submit</button>';
  }
  events_content += '<button class="btn btn-info" onClick="nextQuestion();" style="float: right;margin-right:10px;">Next</button>';
  events_content += '<button class="btn btn-info" onClick="previousQuestion();" style="float: right;margin-right:10px;">Previous</button>';
  events_content += '</div>';
  $("#event-page").html(events_content);
}

function questions() {
  aftersignin();
  if (question_list.length == 0) {
    if (quiz) {
      $.ajax({
        url: domain + "/competition/" + quiz + "/questions/",
        headers: headers,
      }).done(function (data, status) {
        total_questions += data.length;
        question_list = data;
        var answers = {};
        for(var i=0; i<question_list.length; i++){
          answers[question_list[i].id] = "";
        }
        setCookie("questions_" + quiz, JSON.stringify(question_list), 1);
        setCookie("answers_" + quiz, JSON.stringify(answers), 1);
        question(current_question_index);
      });
    } else {
      location.href = "/events.html";
    }
  } else {
    question(current_question_index); 
  }
}

function nextQuestion() {
  if (current_question_index < total_questions - 1) {
    current_question_index++;
    question();
  }
}

function previousQuestion() {
  if (current_question_index > 0) {
    current_question_index--;
    question();
  }
}

function clearSelection(j) {
  var elem = document.getElementsByTagName('input');
  for (var i = 0; i < elem.length; i++)
    elem[i].checked = false;
  answers[j] = "";
  setCookie("answers_" + quiz, JSON.stringify(answers), 1);
}



function event_page() {
  aftersignin();
  var e = Object.fromEntries(new URLSearchParams(location.search));
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
      event_content += '<p><strong>Event Timings: </strong> &nbsp;' + s.getHours() + ':' + s.getMinutes() + " to " + e.getHours() + ':' + e.getMinutes() + '</p>';
      event_content += '<p><strong>Fees: </strong> &nbsp;' + data.fee + '</p>';
      if (data.registered) {
        event_content += '<button class="btn btn-info" disabled>Registered</button>';
      } else if (data.pending) {
        event_content += '<button class="btn btn-info" disabled>Pending Status</button>';
      } else {
        event_content += '<button class="btn btn-info" onclick="eventRegister(' + data.id + ', ' + data.final_fee + ');">Register</button>';
      }
      event_content += '</div>';
      event_content += '<h2>Competition List:</h2>';
      for (i = 0; i < data.comp.length; ++i) {
        event_content += '<div class="event-block">';
        event_content += '<h3>' + (i + 1) + '. ' + data.comp[i].name + '</h3><br>';
        for (j = 0; j < data.comp[i].about.length; ++j) {
          event_content += '<p>' + data.comp[i].about[j] + '</p><br>';
        }
        let s = new Date(data.comp[i].start_time);
        let e = new Date(data.comp[i].end_time);
        event_content += '<p><strong>Event Date: </strong> &nbsp;' + s.getDate() + '-' + s.getMonth() + '-' + s.getFullYear() + '</p>';
        event_content += '<p><strong>Event Timings: </strong> &nbsp;' + s.getHours() + ':' + s.getMinutes() + " to " + e.getHours() + ':' + e.getMinutes() + '</p>';
        event_content += '<p><strong>Fees: </strong> &nbsp;' + ((data.comp[i].fee.paid) ? data.comp[i].fee.fees : 0) + '</p>';
        if (data.registered)
          event_content += '<button class="btn btn-info" onclick="quizRegister(' + data.comp[i].id + ', ' + ((data.comp[i].fee.paid) ? data.comp[i].fee.fees : 0) + ');" ' + ((data.comp[i].registered) ? "disabled":"") + '>Register' + ((data.comp[i].registered) ? "ed":"") + '</button>';
        var flag = true;
        if (s < new Date() && new Date() < e)
          flag = false;
        if (data.comp[i].registered)
          event_content += '<button class="btn btn-info" onclick="location.href=\'/quiz.html?competition=' + data.comp[i].id + '\'" style="float: right;" ' + ((flag) ? "disabled" : "") + '>GoTo Quiz</button>';

        if (data.comp[i].leaderboard && data.comp[i].leaderboard.val && data.comp[i].leaderboard.val.length > 0) {
          event_content += '<br /><br /><h3>Leaderboard</h3>';
          event_content += '<table style="width: 100%;">';
          event_content += '<tr><th>Position</th>';
          for (var j = 0; j < data.comp[i].leaderboard.key.length; j++) {
            event_content += '<th>' + data.comp[i].leaderboard.key[j] + '</th>';
          }
          event_content += '</tr>';
          for (var j = 0; j < data.comp[i].leaderboard.val.length; j++) {
            event_content += '<tr><td>' + (j+1) + '</td>';
            for (var k = 0; k < data.comp[i].leaderboard.val[j].length; k++) {
              event_content += '<td>' + data.comp[i].leaderboard.val[j][k] + '</td>'
            }
            event_content += '</tr>';
          }
        }
        event_content += '</table>'
        event_content += '</div>';
      }
      $("#event-page").html(event_content);
    })
  } else {
    location.href = "/events.html";
  }
}