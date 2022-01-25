const { ipcRenderer } = require("electron");

let prev_index = "init";
let sentences = [];
let span_records = {};
let sentence_length = {};
let sentence_record = {};
let current_target = {};

// function addNewCell(example, sentence_id) {
//   var premise_arr = example["premise"].split(" ");
//   var hypothesis_arr = example["hypothesis"].split(" ");

//   var premise_with_idx = "";
//   for (const [index, token] of premise_arr.entries()) {
//     premise_with_idx += `<span>${token}<span style="color:DodgerBlue;"><strong>[${index}]</strong></span></span>`;
//   }

//   var hypothesis_with_idx = "";
//   for (const [index, token] of hypothesis_arr.entries()) {
//     hypothesis_with_idx += `<span>${token}<span style="color:DodgerBlue;"><strong>[${index}]</strong></span></span>`;
//   }

//   var premise_head = `<span style="color:DodgerBlue;"><strong>[PREMISE]</strong></span>`;
//   var premise = `<p class="card-text">${premise_head} ${premise_with_idx}</p>`;
//   var hypo_head = `<span style="color:DodgerBlue;"><strong>[HYPOTHESIS]</strong></span>`;
//   var hypothesis = `<p class="card-text">${hypo_head} ${hypothesis_with_idx}</p>`;
//   var lb_head = `<span style="color:DodgerBlue;"><strong>[LABEL]</strong></span>`;
//   var label = `<p class="card-text">${lb_head} ${example["label"]}</p>`;
//   var newButtonBarID = "buttonbar" + sentence_id.toString();

//   var inner_html = `
//   <div class="card" id="${newButtonBarID}">
//     <div class="card-body">
//       <li class="list-group-item">
//         ${premise}${hypothesis}${label}
//       </li>
//       <input type="text"
//         class="form-control span-input"
//         placeholder="premise span"
//         id="align_p${sentence_id}"/>
//       <input type="text"
//         class="form-control span-input"
//         placeholder="hypothesis span"
//         id="align_h${sentence_id}"/>
//       <button type="button"
//         class="btn btn-primary"
//         style="float:left; margin: 25px 0px 10px 0px;"
//         id="add_align${sentence_id}">
//           Add Alignment
//       </button>
//     </div>
//   </div>`;

//   document
//     .querySelector("#buttonbar" + prev_index)
//     .insertAdjacentHTML("afterend", inner_html);
//   prev_index = sentence_id;
// }

function collect_span(sentence_id) {
  var span = [];
  for (var i = 0; i < sentence_length[sentence_id]; i++) {
    var token_id = `s_${sentence_id}_w_${i}`;
    if (document.getElementById(token_id).checked == true) {
      var text = document.getElementById(token_id).value;
      document.getElementById(
        `s_${sentence_id}_w_${i}_label`
      ).innerHTML = `<span style="background-color: #FFFF00">${text}</span>`;
      span.push(i);
    }
  }
  return span;
}

function build_span1(sentence_id) {
  span = collect_span(sentence_id);
  current_target.span1 = [span[0], span[span.length - 1] + 1];
  clear_checkboxes(sentence_id);
}

function build_span2(sentence_id) {
  span = collect_span(sentence_id);
  current_target.span2 = [span[0], span[span.length - 1] + 1];
  clear_checkboxes(sentence_id);
}

function record_span(sentence_id) {
  current_target.label = document.getElementById(`${sentence_id}_label`).value;
  span_records[sentence_id].push(current_target);
  console.log(span_records[sentence_id]);
}

function complete(sentence_id) {
  ipcRenderer.send("new_span", {
    text: sentence_record[sentence_id],
    target: span_records[sentence_id],
  });
  clear_checkboxes(sentence_id);
}

function clear_checkboxes(sentence_id) {
  for (var i = 0; i < sentence_length[sentence_id]; i++) {
    var token_id = `s_${sentence_id}_w_${i}`;
    document.getElementById(token_id).checked = false;
  }
}

function outerHTML(node) {
  var wrapper = document.createElement("div");
  wrapper.appendChild(node);
  return wrapper.innerHTML;
}

document.getElementById("start").addEventListener("click", (event) => {
  event.preventDefault();
  ipcRenderer.send("load_batch", dataset_name.value);
  submit_batch.disabled = false;
});

function clear_sentences() {
  sentences = [];
  var init_bar = document.createElement("div");
  init_bar.setAttribute("class", "conclusion");
  init_bar.setAttribute("id", "buttonbarinit");
  document.getElementById("block0").innerHTML = "";
  document.getElementById("block0").appendChild(init_bar);
}

function get_next_batch() {
  console.log("get next batch");
  clear_sentences();
  prev_index = "init";
  ipcRenderer.send("get_next_batch");
}

function get_prev_batch() {
  clear_sentences();
  prev_index = "init";
  ipcRenderer.send("get_prev_batch");
}

const fileSelector = document.getElementById("dataset_selector");
const dataset_name = document.getElementById("dataset_name_input");
const load_input_btn = document.getElementById("load_input");
const submit_batch = document.getElementById("submit_batch");
var fileList = [];

fileSelector.addEventListener("change", (event) => {
  event.preventDefault();
  fileList = event.target.files;
});

load_input_btn.addEventListener("click", (event) => {
  event.preventDefault();
  load_input_file();
});

function load_input_file() {
  var dataset_path = fileList[0].path;
  ipcRenderer.send("load_dataset", dataset_name.value, dataset_path);
  fileSelector.disabled = true;
  dataset_name.disabled = true;
}

ipcRenderer.on("file_loaded", (event) => {
  event.preventDefault();
  alert("Input sentences are loaded into database !");
});

ipcRenderer.on("new_annotation_reply", (event, sentence) => {
  sentences.push(sentence);
  // if (sentences.length == 10) {
  //   sentences.forEach((element) => {
  //     addNewCell(element.text, element.id);
  //   });
  // }
});
