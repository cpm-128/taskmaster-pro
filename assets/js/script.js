// sortable lists start
$(".card .list-group").sortable({       // sortable() makes all .list-group sortable
  connectWith: $(".card .list-group"),  // connect with means you can drag/drop across all .list-group elements bc they are connected
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event) {
    $(event.target).addClass("dropover-active");
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function(event) {
    $(event.target).removeClass("dropover-active");
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
  update: function(event) {
    // array to store the task data in as it's updated
    var tempArr = [];

    // loop over current set of children <li> in sortable list
    $(this).children().each(function() {
      var text = $(this)
        .find("p")
        .text()
        .trim();
      var date = $(this)
        .find("span")
        .text()
        .trim();

    // add task date to the temp array as an object
    tempArr.push({
      text: text,
      date: date
    });
    });
    console.log(tempArr);

    // trim down list's ID to match object property
    var arrName = $(this)
      .attr("id")
      .replace("list-" , "");

    // update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  }
});
// sortable lists end

// delete trash drop start
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    console.log(">>> drop >>>");
    ui.draggable.remove(); // this is what actually removes what you are dragging
  },
  over: function(event, iu) {
    console.log(">>> over >>>");
  },
  out: function(event, iu) {
    console.log(">>> out >>>");
  }
});
// delete trash drop end

// date picker calendar start for new tasks
$("#modalDueDate").datepicker({
  // prevent entering past dates, 1 = how many days after the current day
  minDate: 0
});
// date picker calendar end for new tasks

// start audit tasks for color coding
var auditTask = function(taskEl) {

  // DUE DATE: get date from task element
  var date = $(taskEl).find("span").text().trim();
    // check it worked
    // console.log(">>> due date from span >>>" , date);

  // PAST-DUE?: convert to moment object at 5:00pm today
  var time = moment(date, "L").set("hour", 17); // L = locat time, hour 17 = 5pm, end of work day
    // this should print out an object for the value of the date variable, but at 5pm of that date
    // console.log(">>> CoB today >>>" , time);

  // remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if task is near/over due date, if right now is after var time
  if(moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } else if(Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
  // abs is to get the absolute value, no negatives. this avoids confusion with -2 days
};
// end audit tasks for color coding

// create tasks start
var tasks = {};

var createTask = function(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// add event listener that the task description was clicked and tearn into text area
$(".list-group").on("click" , "p" , function() {
  var text = $(this)
    .text()
    .trim();
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);
  $(this).replaceWith(textInput);
    textInput.trigger("focus");
});

// event listen to save text area when clicked outside of element aka no longer in focus aka blue
$(".list-group").on("blur" , "textarea" , function() {

  // get the textarea's current value/text
  var text = $(this)
    .val()
    .trim();

  // get the parent ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-" , "");

  // get the task's position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and re-save to localStorage
  tasks[status][index].text = text;
  saveTasks();

  // recreate p element
  var taskP = $("<p>")
    .addClass("m-1")
    .text(text);

  // replace textarea with p element
  $(this).replaceWith(taskP);
});

// change due date was clicked with calendar picker
$(".list-group").on("click" , "span" , function() {

  // get current text
  var date = $(this)
    .text()
    .trim();

  // create new input element
  var dateInput = $("<input>")
    .attr("type" , "text")
    .addClass("form-control")
    .val(date);

  //swap out element
  $(this).replaceWith(dateInput);

  // enable jquery ui calendar datepicker
  dateInput.datepicker({
    minDate: 0,
    onClose: function() {
      // when the calendar is closed, force a 'change' evnet on the dateInput to avoid errors when deciding to not change date
      $(this).trigger("change");
    }
  });

  // automatically focus on new element and bring up calendar
  dateInput.trigger("focus");

});

// value of due date was changed
$(".list-group").on("change" , "input[type='text']" , function() {
  //get current text
  var date = $(this)
  .val()
  .trim();

  // get the paren ul's id attribute
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-" , "");

  // get the tasks' position in the list of other li elements
  var index = $(this)
    .closest(".list-group-item")
    .index();

  // update task in array and re-save to localStorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap class
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  // pass task's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
});



// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-save").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();

// audit tasks every 30 min even when browser is not refreshed
setInterval(function() {
  $(".card .list-group-item").each(function(index, el) {
    auditTask(el);
  });
}, 1800000);


