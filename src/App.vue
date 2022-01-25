<template>
  <div class="main-content">
    <div class="truth-content">
      <h1 class="intro">Semantic Alignment Annotator</h1>
      <h2 class="intro-content">
        Simple tool for annotating smeantic alignment pairs
      </h2>
      <form>
        <div class="form-group">
          <label for="exampleInputEmail1">Dataset Name</label>
          <input
            type="text"
            class="form-control"
            v-on:change="(event) => get_dataset_name(event)"
            placeholder="Enter dataset name"
          />
          <input
            type="file"
            class="form-control"
            id="dataset_selector"
            accept=".csv, .txt, .json, .jsonl, .tsv"
          />
        </div>
        <button
          type="button"
          class="btn btn-primary"
          v-on:click="load_dataset_to_db"
        >
          Load
        </button>
        <button
          type=" button"
          class="btn btn-primary"
          v-on:click="(event) => start_annotation(event)"
        >
          Start Annotate
        </button>
      </form>
      <div class="card cell">
        <div class="card-header"></div>
        <div class="card-body">
          <blockquote class="blockquote mb-0" id="block_start">
            <div class="conclusion" id="buttonbar">
              <div class="addNew">
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  v-on:click="get_prev_example"
                >
                  <i class="fas fa-arrow-left"></i>
                </button>
                <div class="addNew"></div>
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  v-on:click="get_next_example"
                >
                  <i class="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </blockquote>
          <blockquote class="blockquote mb-0" id="block0">
            <div class="conclusion" v-if="staging.start_annotate">
              <div class="card">
                <div class="card-body passage-display-box">
                  <li class="list-group-item">
                    <p class="card-text passage-text">
                      <span style="color: DodgerBlue"
                        ><strong>[PREMISE]</strong></span
                      >
                      <span
                        class="noselect"
                        v-for="(token, index) in staging.premise_tokens"
                        v-bind:key="token.index"
                        v-on:mousedown="mousedown_text(index, true)"
                        v-on:mouseup="mouseup_text(index, true)"
                        v-on:mouseenter="mouseenter_text(index, true)"
                        v-bind:class="{
                          highlight: should_highlight(index, true),
                          select_highlight: is_in_selection_highlight(
                            index,
                            true
                          ),
                          is_selected_answer: is_selected_answer_highlight(
                            index,
                            true
                          ),
                        }"
                        >{{ token + " " }}</span
                      >
                    </p>
                    <p class="card-text">
                      <span style="color: DodgerBlue"
                        ><strong>[HYPOTHESIS]</strong></span
                      >
                      <span
                        class="noselect"
                        v-for="(token, index) in staging.hypothesis_tokens"
                        v-bind:key="token.index"
                        v-on:mousedown="mousedown_text(index, false)"
                        v-on:mouseup="mouseup_text(index, false)"
                        v-on:mouseenter="mouseenter_text(index, false)"
                        v-bind:class="{
                          highlight: should_highlight(index, false),
                          select_highlight: is_in_selection_highlight(
                            index,
                            false
                          ),
                          is_selected_answer: is_selected_answer_highlight(
                            index,
                            false
                          ),
                        }"
                        >{{ token + " " }}</span
                      >
                    </p>
                    <p class="card-text">
                      <span style="color: DodgerBlue"
                        ><strong>[LABEL]</strong></span
                      >
                      {{ staging.current_example["label"] }}
                    </p>
                  </li>
                  <input
                    type="text"
                    v-bind:value="display_selected_text(true)"
                    class="form-control span-input"
                    placeholder="premise span"
                  />
                  <input
                    type="text"
                    v-bind:value="display_selected_text(false)"
                    class="form-control span-input"
                    placeholder="hypothesis span"
                  />
                  <div class="btn-group" style="float: left">
                    <button
                      type="button"
                      class="btn btn-primary"
                      style="margin: 25px 0px 10px 0px"
                    >
                      Add Alignment
                    </button>

                    <button
                      class="btn btn-outline-danger"
                      type="button"
                      v-on:click="clear_selection"
                      data-balloon-pos="up"
                      aria-label="Clear selection"
                      style="margin: 25px 0px 10px 0px"
                    >
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </blockquote>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Vue from "vue";

export default {
  name: "AnnotationInterface",

  components: {},

  data: function () {
    return {
      /**
       *
       * Tab switching.
       *
       */
      active_tab: "overview",
      frozen: true,
      frozen_time: 3,
      seconds_remain: 180,

      data_loaded: false,
      annotations: {},

      current: {
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

        selected_char_indices_p: {},
        selected_char_indices_for_answers: {},

        selected_char_indices_h: {},
      },

      staging: {
        dataset_name: null,
        dataset_path: null,

        pinned_example_id: null,
        start_annotate: false,
        current_example_id: 0,
        current_example: "",
        examples: [],

        premise: "",
        hypothesis: "",
        premise_tokens: [],
        hypothesis_tokens: [],
        alignments: [],

        submit_batch: false,
      },
    };
  },
  methods: {
    get_dataset_name: function (event) {
      this.staging.dataset_name = event.target.value;
    },
    get_file_path: function (event) {
      var fileList = event.target.files;
      this.staging.dataset_path = fileList[0].path;
    },
    start_annotation: function (event) {
      event.preventDefault();
      window.ipcRenderer.send("load_batch", this.staging.dataset_name);
      this.staging.submit_batch = true;
    },
    load_dataset_to_db: function () {
      window.ipcRenderer.send(
        "load_dataset",
        this.staging.dataset_name,
        this.staging.dataset_path
      );
    },
    get_next_batch: function () {
      window.ipcRenderer.send("get_next_batch");
    },
    get_prev_batch: function () {
      window.ipcRenderer.send("get_prev_batch");
    },
    get_prev_example: function () {
      this.staging.current_example_id -= 1;
      if (this.staging.current_example_id < 0) {
        this.staging.current_example_id = 0;
      }
      let example_id = this.staging.current_example_id;
      this.staging.current_example = this.staging.examples[example_id];
      this.staging.premise = this.staging.current_example["premise"];
      this.staging.hypothesis = this.staging.current_example["hypothesis"];
      this.staging.premise_tokens = this.staging.premise.split(" ");
      this.staging.hypothesis_tokens = this.staging.hypothesis.split(" ");
    },
    get_next_example: function () {
      this.staging.current_example_id += 1;
      if (this.staging.current_example_id > 9) {
        this.staging.current_example_id = 9;
      }
      let example_id = this.staging.current_example_id;
      this.staging.current_example = this.staging.examples[example_id];
      this.staging.premise = this.staging.current_example["premise"];
      this.staging.hypothesis = this.staging.current_example["hypothesis"];
      this.staging.premise_tokens = this.staging.premise.split(" ");
      this.staging.hypothesis_tokens = this.staging.hypothesis.split(" ");
    },

    display_selected_text: function (premise) {
      let selection = this.current.selection_h;
      let text = this.staging.hypothesis_tokens;
      if (premise) {
        selection = this.current.selection_p;
        text = this.staging.premise_tokens;
      }

      if (selection.start >= 0 && selection.end >= 0) {
        let surface = text.slice(selection.start, selection.end + 1).join(" ");
        return surface;
      } else {
        return "";
      }
    },
    clear_selection: function () {
      this.current.selection_p.state = "none";
      this.current.selection_p.start = -1;
      this.current.selection_p.end = -1;
      this.current.selection_p.current = -1;
      this.current.selection_h.state = "none";
      this.current.selection_h.start = -1;
      this.current.selection_h.end = -1;
      this.current.selection_h.current = -1;
    },

    /**
     *
     *
     * Functions for modifying current answers.
     *
     *
     */

    is_answer_not_event: function () {
      let start = this.current.selection.start;
      let end = this.current.selection.end;
      let event_key = start + "_" + end;

      if (
        !Object.prototype.hasOwnProperty.call(
          this.staging.alignments,
          event_key
        )
      ) {
        return true;
      }

      return false;
    },

    can_add_answer: function (event) {
      if (event.start === -1 || event.end === -1) {
        this.show_qa_error("The answer cannot be empty!");
        return false;
      }

      if (this.staging.current_question.text.length === 0) {
        this.show_qa_error("This question is empty");
        return false;
      }

      if (this.is_answer_not_event()) {
        this.show_qa_error(
          "Choose an answer from highlighted events! If you're sure of your answer, you can first add it to the event list by clicking the 'Edit Event Selection' button on the left!"
        );
        return false;
      }

      this.hide_qa_error();
      return true;
    },

    add_answer: function () {
      this.trim_start_end_to_nearest_space();

      let start = this.current.selection.start;
      let end = this.current.selection.end;
      let event_key = start + "_" + end;

      const event = { start, end, key: event_key };

      if (!this.can_add_answer(event)) {
        return false;
      }

      if (this.can_add_answer(event)) {
        let start = this.current.selection.start;
        let end = this.current.selection.end;
        let event_key = start + "_" + end;
        const event = { start, end, key: event_key };
        console.log(event_key);
        Vue.set(this.staging.current_question.answers, event_key, event);
        console.log(this.staging.current_question.answers);
        console.log("Updating highlight map.");

        for (let i = start; i <= end; i++) {
          Vue.set(this.current.selected_char_indices_for_answers, i, true);
        }
      } else {
        console.log("Cannot add answer.");
      }
    },

    delete_answer: function (event) {
      this.$delete(this.staging.current_question.answers, event.key);
      for (let i = event.start; i <= event.end; i++) {
        Vue.set(this.current.selected_char_indices_for_answers, i, false);
      }
    },

    is_selected_answer_highlight: function (idx) {
      return this.current.selected_char_indices_for_answers[idx] === true;
    },

    highlight_selected_answer: function (start, end) {
      for (let i = start; i <= end; i++) {
        Vue.set(this.current.selected_char_indices_for_answers, i, true);
      }
    },

    /*************************************************************************************
     *
     * Below methods are used to handling span selections.
     *
     ************************************************************************************/

    should_highlight: function (index, premise) {
      if (premise) {
        return this.current.selected_char_indices_p[index] === true;
      } else {
        return this.current.selected_char_indices_h[index] === true;
      }
    },

    mousedown_text: function (index, premise) {
      if (premise) {
        this.current.selection_p.start = index;
        this.current.selection_p.state = "selecting";
      } else {
        this.current.selection_h.start = index;
        this.current.selection_h.state = "selecting";
      }
    },

    mouseup_text: function (index, premise) {
      if (premise) {
        this.current.selection_p.end = index;
        this.current.selection_p.state = "none";
        let _start = Math.min(
          this.current.selection_p.start,
          this.current.selection_p.end
        );
        let _end = Math.max(
          this.current.selection_p.start,
          this.current.selection_p.end
        );
        this.current.selection_p.start = _start;
        this.current.selection_p.end = _end;
      } else {
        this.current.selection_h.end = index;
        this.current.selection_h.state = "none";
        let _start = Math.min(
          this.current.selection_h.start,
          this.current.selection_h.end
        );
        let _end = Math.max(
          this.current.selection_h.start,
          this.current.selection_h.end
        );
        this.current.selection_h.start = _start;
        this.current.selection_h.end = _end;
      }
    },

    mouseenter_text: function (index, premise) {
      if (premise) {
        this.current.selection_p.current = index;
      } else {
        this.current.selection_h.current = index;
      }
    },

    /**
     * invalidate the current selection, this happens when mouse moved out of the selection scope.
     */
    invalidate_selection: function () {
      if (this.current.selection.state !== "none") {
        this.clear_selection();
      }
    },

    /**
     * Should the current char be highlighted as part of the selection process?
     */
    is_in_selection_highlight: function (idx, premise) {
      let selection = this.current.selection_h;
      if (premise) {
        selection = this.current.selection_p;
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

  mounted() {
    this.$nextTick(function () {
      window.ipcRenderer.on("file_loaded", (event) => {
        event.preventDefault();
        alert("Input sentences are loaded into database !");
      });

      window.ipcRenderer.on("load_example", (example) => {
        this.staging.examples.push(example);
        if (this.staging.examples.length == 10) {
          this.staging.start_annotate = true;
        }
        this.staging.current_example = this.staging.examples[0];
        this.staging.premise = this.staging.current_example["premise"];
        this.staging.hypothesis = this.staging.current_example["hypothesis"];
        this.staging.premise_tokens = this.staging.premise.split(" ");
        this.staging.hypothesis_tokens = this.staging.hypothesis.split(" ");
      });
    });
  },
};
</script>
