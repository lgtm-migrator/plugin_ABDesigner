/*
 * ui_work_object_list_newObject
 *
 * Display the form for creating a new Object.  This Popup will manage several
 * different sub components for gathering Object data for saving.
 *
 * The sub components will gather the data for the object and do basic form
 * validations on their interface.
 *
 * when ready, the sub component will emit "save" with the values gathered by
 * the form.  This component will manage the actual final object validation,
 * and saving to this application.
 *
 * On success, "save.success" will be emitted on the sub-component, and this
 * component.
 *
 * On Error, "save.error" will be emitted on the sub-component.
 *
 */

import UIBlankObject from "./ui_work_object_list_newObject_blank";
import UICsvObject from "./ui_work_object_list_newObject_csv";
import UIImportObject from "./ui_work_object_list_newObject_import";
// const ABImportExternal = require("./ab_work_object_list_newObject_external");
export default function (AB) {
   const ClassUI = AB.ClassUI;
   var L = function (...params) {
      return AB.Multilingual.labelPlugin("ABDesigner", ...params);
   };

   class UI_Work_Object_List_NewObject extends ClassUI {
      //.extend(idBase, function(App) {

      constructor() {
         var base = "ab_work_object_list_newObject";
         super({
            component: base,
            tab: `${base}_tab`,
         });

         this.currentApplicationID = null;
         // {string}
         // the ABApplication.id we are currently working on.

         this.selectNew = true;
         // {bool} do we select a new object after it is created.

         // var callback = null;

         this.BlankTab = UIBlankObject(AB);
         this.CsvTab = UICsvObject(AB);
         this.ImportTab = UIImportObject(AB);
         /*
         this.ExternalTab = new ABImportExternal(AB);
         */
      }

      ui() {
         // Our webix UI definition:
         return {
            view: "window",
            id: this.ids.component,
            // width: 400,
            position: "center",
            modal: true,
            head: {
               view: "toolbar",
               css: "webix_dark",
               cols: [
                  {
                     view: "label",
                     label: L("Add new object"),
                     css: "modal_title",
                     align: "center",
                  },
                  {
                     view: "button",
                     autowidth: true,
                     type: "icon",
                     icon: "nomargin fa fa-times",
                     click: () => {
                        this.emit("cancel");
                     },
                     on: {
                        onAfterRender() {
                           ClassUI.CYPRESS_REF(this);
                        },
                     },
                  },
               ],
            },
            selectNewObject: true,
            body: {
               view: "tabview",
               id: this.ids.tab,
               cells: [
                  this.BlankTab.ui() /*, this.ImportTab.ui(), this.ExternalTab.ui() */,
                  this.CsvTab.ui(),
                  this.ImportTab.ui(),
               ],
               tabbar: {
                  on: {
                     onAfterTabClick: (id) => {
                        this.switchTab(id);
                     },
                     onAfterRender() {
                        this.$view
                           .querySelectorAll(".webix_item_tab")
                           .forEach((t) => {
                              var tid = t.getAttribute("button_id");
                              AB.ClassUI.CYPRESS_REF(t, `${tid}_tab`);
                           });
                     },
                  },
               },
            },
            on: {
               onBeforeShow: () => {
                  var id = $$(this.ids.tab).getValue();
                  this.switchTab(id);
               },
            },
         };
      }

      async init(AB) {
         this.AB = AB;

         webix.ui(this.ui());
         webix.extend($$(this.ids.component), webix.ProgressBar);

         this.$component = $$(this.ids.component);

         var allInits = [];
         ["BlankTab", "CsvTab", "ImportTab" /*, "ExternalTab"*/].forEach(
            (k) => {
               allInits.push(this[k].init(AB));
               this[k].on("cancel", () => {
                  this.emit("cancel");
               });
               this[k].on("save", (values) => {
                  this.save(values, k);
               });
            }
         );

         return Promise.all(allInits);
      }

      /**
       * @method applicationLoad()
       * prepare ourself with the current application
       * @param {ABApplication} application
       *        The current ABApplication we are working with.
       */
      applicationLoad(application) {
         this.currentApplicationID = application?.id;
      }

      /**
       * @function hide()
       *
       * remove the busy indicator from the form.
       */
      hide() {
         if (this.$component) this.$component.hide();
      }

      /**
       * Show the busy indicator
       */
      busy() {
         if (this.$component) {
            this.$component.showProgress();
         }
      }

      /**
       * Hide the busy indicator
       */
      ready() {
         if (this.$component) {
            this.$component.hideProgress();
         }
      }

      /**
       * @method done()
       * Finished saving, so hide the popup and clean up.
       * @param {object} obj
       */
      done(obj) {
         this.ready();
         this.hide(); // hide our popup
         this.emit("save", obj, this.selectNew);
         // _logic.callbacks.onDone(null, obj, selectNew, callback); // tell parent component we're done
      }

      /**
       * @method save
       * take the data gathered by our child creation tabs, and
       * add it to our current application.
       * @param {obj} values  key=>value hash of model values.
       * @param {string}  tabKey
       *        the "key" of the tab initiating the save.
       * @return {Promise}
       */
      async save(values, tabKey) {
         // must have an application set.
         if (!this.currentApplicationID) {
            webix.alert({
               title: L("Shoot!"),
               test: L("No Application Set!  Why?"),
            });
            this[tabKey].emit("save.error", true);
            return false;
         }

         // create a new (unsaved) instance of our object:
         var newObject = this.AB.objectNew(values);

         // have newObject validate it's values.
         var validator = newObject.isValid();
         if (validator.fail()) {
            this[tabKey].emit("save.error", validator);
            // cb(validator); // tell current Tab component the errors
            return false; // stop here.
         }

         if (!newObject.createdInAppID) {
            newObject.createdInAppID = this.currentApplicationID;
         }

         // show progress
         this.busy();

         var application = this.AB.applicationByID(this.currentApplicationID);

         // if we get here, save the new Object
         try {
            var obj = await newObject.save();
            await application.objectInsert(obj);
            this[tabKey].emit("save.successful", obj);
            this.done(obj);
         } catch (err) {
            // hide progress
            this.ready();

            // an error happend during the server side creation.
            // so remove this object from the current object list of
            // the current application.
            await application.objectRemove(newObject);

            // tell current Tab component there was an error
            this[tabKey].emit("save.error", err);
         }
      }

      /**
       * @function show()
       *
       * Show this component.
       */
      show(shouldSelectNew) {
         if (shouldSelectNew != null) {
            this.selectNew = shouldSelectNew;
         }
         if (this.$component) this.$component.show();
      }

      switchTab(tabId) {
         if (tabId == this.BlankTab?.ui?.body?.id) {
            this.BlankTab?.onShow?.(this.currentApplicationID);
         } else if (tabId == this.CsvTab?.ui?.body?.id) {
            this.CsvTab?.onShow?.(this.currentApplicationID);
         } else if (tabId == this.ImportTab?.ui?.body?.id) {
            this.ImportTab?.onShow?.(this.currentApplicationID);
         } else if (tabId == this.ExternalTab?.ui?.body?.id) {
            this.ExternalTab?.onShow?.(this.currentApplicationID);
         }
      }
   }

   return new UI_Work_Object_List_NewObject();
}
