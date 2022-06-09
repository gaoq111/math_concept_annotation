<template>
  <div class="main-content">
    <h1 class="intro">Semantic Alignment and Causal Intervention Annotator</h1>

    <nav style="margin-bottom: 20px">
      <div class="nav nav-tabs" id="nav-tab" role="tablist">
        <a class="nav-item nav-link" v-on:click="switch_tab('upload')" v-bind:class="{
          'active': active_tab === 'upload'
        }">Upload</a>

        <a class="nav-item nav-link" v-on:click="switch_tab('alignment')" v-bind:class="{
         'active': active_tab === 'alignment'
        }">Alignment</a>

        <a class="nav-item nav-link" v-on:click="switch_tab('intervention')" v-bind:class="{
          'active': active_tab === 'intervention'
        }">Intervention</a>

        <a class="nav-item nav-link" v-on:click="switch_tab('nli')" v-bind:class="{
         'active': active_tab === 'nli'
        }">NLI Annotation</a>
      </div>
    </nav>

    <form class="row g-3" v-if="active_tab === 'upload'">
      <div class="col-auto">
        <input type="text" class="form-control" v-on:change="(event) => get_dataset_name(event)"
          placeholder="Enter dataset name" />
      </div>
      <div class="col-auto">
        <input type="file" class="form-control" id="dataset_selector" accept=".csv, .txt, .json, .jsonl, .tsv"
          v-on:change="(event) => get_file_path(event)" />
      </div>
      <div class="col-auto">
        <button type="button" class="btn btn-primary mb-3" v-on:click="load_dataset_to_db">Load</button>
      </div>
    </form>

    <form class="row g-3" v-if="active_tab !== 'upload'">
      <div class="col-auto">
        <div class="dropdown">
          <button class="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton1"
            data-bs-toggle="dropdown" aria-expanded="false">
            {{ selector_val }}
          </button>
          <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1">
            <li v-for="(dataset, index) in dataset_names" v-bind:key="index"
              v-on:click="(event) => selector_show(event)">
              <a class="dropdown-item">{{ dataset }}</a>
            </li>
          </ul>
        </div>
      </div>
      <div class="col-auto">
        <input type="text" class="form-control" v-on:change="(event) => get_starting_index(event)"
          placeholder="Enter starting index" />
      </div>
      <div class="col-auto">
        <button type=" button" class="btn btn-primary mb-3"
          v-on:click="(event) => start_annotation(event)">Start</button>
      </div>
    </form>

    <div class="card cell" v-if="active_tab === 'alignment'">
      <div class="card-body">
        <div class="conclusion" id="buttonbar">
          <div class="addNew">
            <button type="button" class="btn btn-primary btn-sm" v-on:click="get_prev_example">
              <i class="fas fa-arrow-left"></i>
            </button>
            <div class="addNew"></div>
            <button type="button" class="btn btn-primary btn-sm" v-on:click="get_next_example">
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>

        <div class="conclusion card" v-if="staging.start_annotate">
          <div class="card-body passage-display-box">
            <li class="list-group-item">
              <span style="color: DodgerBlue"><strong>[{{ staging.current_example_id }}]</strong></span>
              <p class="card-text passage-text">
                <span style="color: DodgerBlue"><strong>[PREMISE]</strong></span>
                <span class="noselect" v-for="(token, index) in staging.current_example
                .premise_tokens" v-bind:key="token.index" v-on:mousedown="mousedown_text(index, true)"
                  v-on:mouseup="mouseup_text(index, true)" v-on:mouseenter="mouseenter_text(index, true)"
                  v-bind:style="highlight_with_color(index, true)">{{ token + " " }}</span>
              </p>
              <p class="card-text">
                <span style="color: DodgerBlue"><strong>[HYPOTHESIS]</strong></span>
                <span class="noselect" v-for="(token, index) in staging.current_example
                .hypothesis_tokens" v-bind:key="token.index" v-on:mousedown="mousedown_text(index, false)"
                  v-on:mouseup="mouseup_text(index, false)" v-on:mouseenter="mouseenter_text(index, false)"
                  v-bind:style="highlight_with_color(index, false)">{{ token + " " }}</span>
              </p>
              <p class="card-text">
                <span style="color: DodgerBlue"><strong>[LABEL]</strong></span>
                {{ staging.current_example.label }}
              </p>

              <p class="card-text">
                <span style="color: DodgerBlue"><strong>[REASON]</strong></span>
                {{ staging.current_example.reason }}
              </p>

            </li>
            <div class="col-auto" style="margin-top:20px; width:50%">
              <input type="text" v-bind:value="display_selected_text(true)" class="form-control span-input"
                placeholder="premise span" />
            </div>
            <div class="col-auto" style="margin-top:20px; width:50%">
              <input type="text" v-bind:value="display_selected_text(false)" class="form-control span-input"
                placeholder="hypothesis span" />
            </div>
            <div class="btn-group" style="float: left">
              <button type="button" v-on:click="add_alignment" class="btn btn-primary"
                style="margin: 25px 0px 10px 0px">
                Add Alignment
              </button>
            </div>
            <button type="button" class="btn btn-secondary" v-on:click="submit_current"
              style="margin: 25px 0px 10px 0px; float: right">
              Submit Annotation
            </button>
          </div>
          <ul class="list-group" style="margin: 30px">
            <li v-for="(alignment, index) in staging.current_example
            .alignments" v-bind:key="index" class="
                    list-group-item
                    d-flex
                    justify-content-between
                    align-items-center
                  ">
              <span style="color: DodgerBlue; font-size: 14px">
                <strong>
                  {{ `[${alignment.align_p.text}]` }}
                  <i class="fas fa-arrow-right"></i>
                  {{ `[${alignment.align_h.text}]` }}
                </strong>
              </span>
              <button class="btn btn-outline-danger" type="button" v-on:click="remove_alignment(index)"
                data-balloon-pos="up" aria-label="Delete Alignment" style="margin-right: 10px">
                <i class="fas fa-times"></i>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="card cell" v-if="active_tab === 'intervention'">
      <div class="card-body">
        <div class="conclusion" id="buttonbar">
          <div class="addNew">
            <button type="button" class="btn btn-primary btn-sm" v-on:click="get_prev_example">
              <i class="fas fa-arrow-left"></i>
            </button>
            <div class="addNew"></div>
            <button type="button" class="btn btn-primary btn-sm" v-on:click="get_next_example">
              <i class="fas fa-arrow-right"></i>
            </button>
          </div>
        </div>

        <div class="conclusion card" v-if="staging.start_annotate">
          <div class="card-body passage-display-box">
            <li class="list-group-item">
              <span style="color: DodgerBlue"><strong>[{{ staging.current_example_id }}]</strong></span>
              <p class="card-text passage-text">
                <span style="color: DodgerBlue"><strong>[PREMISE]</strong></span>
                <span class="noselect" v-for="(token, index) in staging.current_example
                .premise_tokens" v-bind:key="token.index" v-on:mousedown="mousedown_text(index, true)"
                  v-on:mouseup="mouseup_text(index, true)" v-on:mouseenter="mouseenter_text(index, true)"
                  v-bind:style="highlight_with_color(index, true)">{{ token + " " }}</span>
              </p>
              <p class="card-text">
                <span style="color: DodgerBlue"><strong>[HYPOTHESIS]</strong></span>
                <span class="noselect" v-for="(token, index) in staging.current_example
                .hypothesis_tokens" v-bind:key="token.index" v-on:mousedown="mousedown_text(index, false)"
                  v-on:mouseup="mouseup_text(index, false)" v-on:mouseenter="mouseenter_text(index, false)"
                  v-bind:style="highlight_with_color(index, false)">{{ token + " " }}</span>
              </p>
              <p class="card-text">
                <span style="color: DodgerBlue"><strong>[LABEL]</strong></span>
                {{ staging.current_example.label }}
              </p>

              <p class="card-text">
                <span style="color: DodgerBlue"><strong>[REASON]</strong></span>
                {{ staging.current_example.reason }}
              </p>

            </li>
            <div class="col-auto" style="margin-top:20px; width:50%">
              <input type="text" class="form-control span-input"
                placeholder="premise span" />
            </div>
            <div class="col-auto" style="margin-top:20px; width:50%">
              <input type="text" class="form-control span-input"
                placeholder="hypothesis span" />
            </div>
            <div class="btn-group" style="float: left">
              <button type="button" v-on:click="add_alignment" class="btn btn-primary"
                style="margin: 25px 0px 10px 0px">
                Add Intervention
              </button>
            </div>
            <button type="button" class="btn btn-secondary" v-on:click="submit_current"
              style="margin: 25px 0px 10px 0px; float: right">
              Submit Example
            </button>
          </div>
          <ul class="list-group" style="margin: 30px">
            <li v-for="(alignment, index) in staging.current_example
            .alignments" v-bind:key="index" class="
                    list-group-item
                    d-flex
                    justify-content-between
                    align-items-center
                  ">
              <span style="color: DodgerBlue; font-size: 14px">
                <strong>
                  {{ `[${alignment.align_p.text}]` }}
                  <i class="fas fa-arrow-right"></i>
                  {{ `[${alignment.align_h.text}]` }}
                </strong>
              </span>
              <button class="btn btn-outline-danger" type="button" v-on:click="remove_alignment(index)"
                data-balloon-pos="up" aria-label="Delete Alignment" style="margin-right: 10px">
                <i class="fas fa-times"></i>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <form class="row g-2">
      <div class="col-auto">
        <input type="file" class="form-control" id="folder_selector" v-on:change="(event) => get_folder_path(event)"
          webkitdirectory />
      </div>
      <div class="col-auto">
        <button type="button" class="btn btn-primary mb-3" v-on:click="download_annotation">
          Download
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import Vue from "vue";
import { firestorePlugin } from 'vuefire'
import { db } from './firebaseDB'

Vue.use(firestorePlugin)

const fileread = new FileReader();
const label_map = {
  e: "Entailment",
  c: "Contradiction",
  n: "neutral",
};

export default {
  name: "AnnotationInterface",

  components: {},

  props: ['id'],

  data: function () {
    return {
      /**
       *
       * Tab switching.
       *
       */
      active_tab: "alignment",
      frozen: true,
      frozen_time: 3,
      seconds_remain: 180,

      data_loaded: false,

      dataset_names: [
        "anli_r1_test", "anli_r1_train", "anli_r1_val",
        "anli_r2_test", "anli_r2_train", "anli_r2_val",
        "anli_r3_test", "anli_r3_train", "anli_r3_val",
        "snli_train", "snli_val", "snli_test"
      ],

      selector_val: "Select Dataset",

      token_style: {background: 'inherit'},
      color_palette: [
        "#ffd200", "#fa9900", "#d9d2e9", "#cebff0", 
        "#ff9b95", "#f5cfc1", "#e98e00"
      ],


      staging: {
        dataset: null,
        loading_dataset_name: null,
        current_dataset_name: null,
        dataset_path: null,
        download_folder: null,
        start_annotate: false,
        starting_index: 0,
        current_example_id: 0,
        current_example: null,
        current_dp: null,
        examples: {},
        datalist: [],
      },
    };
  },
  
  methods: {
    switch_tab: function (tab) {
      this.active_tab = tab;
    },

    get_dataset_name: function (event) {
      this.staging.loading_dataset_name = event.target.value;
    },
    get_file_path: function (event) {
      var fileList = event.target.files;
      this.staging.datalistset_path = fileList[0];
    },
    get_folder_path: function (event) {
      var fileList = event.target.files;
      this.staging.download_folder = fileList[0].path;
    },
    selector_show: function (event) {
      event.preventDefault();
      this.selector_val = event.target.innerHTML;
      this.staging.current_dataset_name = event.target.innerHTML;
    },
    get_starting_index: function (event) {
      this.staging.starting_index = parseInt(event.target.value);
    },

    start_annotation: function (event) {
      event.preventDefault();
      if (this.dataset_names.includes(this.staging.current_dataset_name)) {
        this.dataset = db.collection(this.staging.current_dataset_name);
        this.staging.current_example_id = this.staging.starting_index;
        this.query_datapoint();
      } else {
        alert("ERROR: dataset does not exit, upload before annotation!")
      }
    },

    query_datapoint: function () {
      this.dataset.where("index", "==", this.staging.current_example_id)
            .get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    this.staging.current_dp = doc.data();
                    this.build_container(this.staging.current_dp);
                    if ("is_annotated" in doc.data()) {
                      if (doc.data()['is_annotated']) {
                        alert("This example is already annotated! You can still review and make updates.")
                      }
                    }
                });
                if (!this.staging.start_annotate) {
                  this.staging.start_annotate = true;
                }
            })
            .catch((error) => {
                console.log("Error getting documents: ", error);
            });
    },

    build_container: function (example) {
      this.staging.datalist.push(example);
      let example_container = {
          premise: example["premise"],
          hypothesis: example["hypothesis"],
          label: example["label"],
          reason: example["reason"],
          premise_tokens: example["premise"].split(" "),
          hypothesis_tokens: example["hypothesis"].split(" "),
          alignments: [],

          selection_p: {
            start: -1,
            end: -1,
            current: -1,
            state: "none",
          },

          selection_h: {
            start: -1,
            end: -1,
            current: -1,
            state: "none",
          },

          token_color_id_p: 0,
          token_color_id_h: 0,
          
          token_background_color_p: {},
          token_background_color_h: {},

          selected_token_indices_p: {},
          selected_token_indices_h: {},
        };

        if ("alignments" in example) {
          example_container["alignments"] = example["alignments"];
        }

        example_container.token_background_color_p = this.init_color_for_token(
          example_container.premise_tokens
        )

        example_container.token_background_color_h = this.init_color_for_token(
          example_container.hypothesis_tokens
        )

        this.staging.current_example = example_container;
        this.staging.examples[this.staging.current_example_id] = example_container;
    },

    init_color_for_token: function (tokens) {
      var tokens_color = {};
      for (var i = 0; i < tokens.length; i++) {
        tokens_color[i] = "inherit";
      }
      return tokens_color;
    },

    load_dataset_to_db: function () {
      fileread.onload = (res) => {
        this.staging.datalistset = res.target.result.replace(/\r\n/g, "\n").split("\n");
        var index = 0;
        this.staging.datalistset.forEach((element) => {
          let example = JSON.parse(element);
          let reason = "";
          let label = "";
          if (this.staging.loading_dataset_name.includes("anli")) {
            reason = example["reason"]
            label = label_map[example["label"]]
          } else {
            reason = example["explanation_1"];
            label = example["label"]
          }
          db.collection(this.staging.loading_dataset_name).add({
            index: index,
            premise: example["premise"],
            hypothesis: example["hypothesis"],
            label: label,
            reason: reason
          }).then((docRef) => {
              console.log("Document written with ID: ", docRef.id);
          })
          .catch((error) => {
              console.error("Error adding document: ", error);
          });
          index += 1;
        });
      };
      fileread.onerror = (err) => console.log(err);
      fileread.readAsText(this.staging.datalistset_path);
    },

    download_annotation: function () {
      window.ipcRenderer.send(
        "download_all",
        this.staging.download_folder
      );
    },

    get_prev_example: function () {
      if (this.staging.current_example_id > 0) {
        this.staging.current_example_id -= 1;
        let example_id = this.staging.current_example_id;
        if (example_id in this.staging.examples) {
          this.staging.current_example = this.staging.examples[example_id];
          this.staging.current_dp = this.staging.datalist[example_id];
        } else {
          this.query_datapoint();
        }
      }
    },

    get_next_example: function () {
      this.staging.current_example_id += 1;
      let example_id = this.staging.current_example_id;
      if (example_id in this.staging.examples) {
        this.staging.current_example = this.staging.examples[example_id];
        this.staging.current_dp = this.staging.datalist[example_id];
      } else {
        this.query_datapoint();
      }
    },

    /*************************************************************************************
     *
     * Below methods are used to handling alignment collection.
     *
     ************************************************************************************/
    add_alignment: function () {
      let selection_h = this.staging.current_example.selection_h;
      let text_h = this.staging.current_example.hypothesis_tokens;

      let selection_p = this.staging.current_example.selection_p;
      let text_p = this.staging.current_example.premise_tokens;

      let alignment_p = "";
      let alignment_h = "";

      if (selection_p.start >= 0 && selection_p.end >= 0) {
        alignment_p = text_p
          .slice(selection_p.start, selection_p.end + 1)
          .join(" ");
      }

      if (selection_h.start >= 0 && selection_h.end >= 0) {
        alignment_h = text_h
          .slice(selection_h.start, selection_h.end + 1)
          .join(" ");
      }

      let alignment = {
        align_p: {
          start: selection_p.start,
          end: selection_p.end,
          text: alignment_p,
        },
        align_h: {
          start: selection_h.start,
          end: selection_h.end,
          text: alignment_h,
        },
      };
      this.staging.current_example.alignments.push(alignment);
      this.clear_selection();
      this.do_highlight_alignment_selection(alignment);
      this.rotate_color_id();
    },

    remove_alignment: function (align_idx) {
      let removed = JSON.stringify(this.staging.current_example.alignments[align_idx]);
      this.staging.current_example.alignments.splice(align_idx, 1);
      this.undo_highlight_alignment_selection(JSON.parse(removed));
    },

    submit_current: function () {
      if (this.staging.current_example.alignments.length == 0) {
        alert("No alignment pairs are annotated !");
      } else {
        this.dataset.where("index", "==", this.staging.current_example_id)
            .limit(1).get()
            .then((querySnapshot) => {
                const doc = querySnapshot.docs[0];
                doc.ref.update({
                    "is_annotated": true,
                    "alignments": this.staging.current_example.alignments,
                }).then(() => {
                    alert("Document successfully updated!");
                });
            })
            .catch((error) => {
                alert("Error getting documents: ", error);
            });
      }
    },

    /*************************************************************************************
     *
     * Below methods are used to handling span selections.
     *
     ************************************************************************************/

    do_highlight_alignment_selection: function (alignment) {
      var background_color_p = this.color_palette[
        this.staging.current_example.token_color_id_p
      ];

      var background_color_h = this.color_palette[
        this.staging.current_example.token_color_id_h
      ];

      for (let i = alignment.align_p.start; i <= alignment.align_p.end; i++) {
        this.staging.current_example.token_background_color_p[i] = background_color_p;
      }
      for (let i = alignment.align_h.start; i <= alignment.align_h.end; i++) {
        this.staging.current_example.token_background_color_h[i] = background_color_h;
      }
    },

    undo_highlight_alignment_selection: function (alignment) {
      for (let i = alignment.align_p.start; i <= alignment.align_p.end; i++) {
        this.staging.current_example.token_background_color_p[i] = "inherit";
      }
      for (let i = alignment.align_h.start; i <= alignment.align_h.end; i++) {
        this.staging.current_example.token_background_color_h[i] = "inherit";
      }
    },

    rotate_color_id: function () {
      this.staging.current_example.token_color_id_p += 1;
      if (this.staging.current_example.token_color_id_p > 6) {
        this.staging.current_example.token_color_id_p = 0;
      }

      this.staging.current_example.token_color_id_h += 1;
      if (this.staging.current_example.token_color_id_h > 6) {
        this.staging.current_example.token_color_id_h = 0;
      }
    },

    highlight_with_color: function (index, premise) {
      if (this.is_in_selection_highlight(index, premise)) {
        return {background: "lightskyblue"}
      }

      if (premise) {
        return {background: this.staging.current_example.token_background_color_p[index]};
      } else {
        return {background: this.staging.current_example.token_background_color_h[index]};
      }
    },

    should_highlight: function (index, premise) {
      if (premise) {
        return (
          this.staging.current_example.selected_token_indices_p[index] === true
        );
      } else {
        return (
          this.staging.current_example.selected_token_indices_h[index] === true
        );
      }
    },

    mousedown_text: function (index, premise) {
      if (premise) {
        this.staging.current_example.selection_p.start = index;
        this.staging.current_example.selection_p.state = "selecting";
      } else {
        this.staging.current_example.selection_h.start = index;
        this.staging.current_example.selection_h.state = "selecting";
      }
    },

    mouseup_text: function (index, premise) {
      if (premise) {
        this.staging.current_example.selection_p.end = index;
        this.staging.current_example.selection_p.state = "none";
        let _start = Math.min(
          this.staging.current_example.selection_p.start,
          this.staging.current_example.selection_p.end
        );
        let _end = Math.max(
          this.staging.current_example.selection_p.start,
          this.staging.current_example.selection_p.end
        );
        this.staging.current_example.selection_p.start = _start;
        this.staging.current_example.selection_p.end = _end;
      } else {
        this.staging.current_example.selection_h.end = index;
        this.staging.current_example.selection_h.state = "none";
        let _start = Math.min(
          this.staging.current_example.selection_h.start,
          this.staging.current_example.selection_h.end
        );
        let _end = Math.max(
          this.staging.current_example.selection_h.start,
          this.staging.current_example.selection_h.end
        );
        this.staging.current_example.selection_h.start = _start;
        this.staging.current_example.selection_h.end = _end;
      }
    },

    mouseenter_text: function (index, premise) {
      if (premise) {
        this.staging.current_example.selection_p.current = index;
      } else {
        this.staging.current_example.selection_h.current = index;
      }
    },

    display_selected_text: function (premise) {
      let selection = this.staging.current_example.selection_h;
      let text = this.staging.current_example.hypothesis_tokens;
      if (premise) {
        selection = this.staging.current_example.selection_p;
        text = this.staging.current_example.premise_tokens;
      }

      if (selection.start >= 0 && selection.end >= 0) {
        let surface = text.slice(selection.start, selection.end + 1).join(" ");
        return surface;
      } else {
        return "";
      }
    },

    clear_selection: function () {
      this.staging.current_example.selection_p.state = "none";
      this.staging.current_example.selection_p.start = -1;
      this.staging.current_example.selection_p.end = -1;
      this.staging.current_example.selection_p.current = -1;
      this.staging.current_example.selection_h.state = "none";
      this.staging.current_example.selection_h.start = -1;
      this.staging.current_example.selection_h.end = -1;
      this.staging.current_example.selection_h.current = -1;
    },

    /**
     * invalidate the current selection, this happens when mouse moved out of the selection scope.
     */
    invalidate_selection: function () {
      if (this.staging.current_example.selection.state !== "none") {
        this.clear_selection();
      }
    },

    /**
     * Should the current char be highlighted as part of the selection process?
     */
    is_in_selection_highlight: function (idx, premise) {
      let selection = this.staging.current_example.selection_h;
      if (premise) {
        selection = this.staging.current_example.selection_p;
      }
      if (selection.state === "selecting") {
        return (
          idx >= Math.min(selection.current, selection.start) &&
          idx <= Math.max(selection.current, selection.start)
        );
      }

      if (selection.state === "none") {
        return idx >= selection.start && idx <= selection.end;
      }

      return false;
    },
  },
};
</script>
