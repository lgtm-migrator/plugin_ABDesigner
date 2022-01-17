/*
 * ui_work_query_list
 *
 * Manage the ABObjectQuery List
 *
 */
import UICommonListFactory from "./ui_common_list";
import UIListNewQuery from "./ui_work_query_list_newQuery";

export default function (AB) {
   const UI_COMMON_LIST = UICommonListFactory(AB);

   class UI_Work_Query_List extends AB.ClassUI {
      constructor() {
         super("ui_work_query_list");

         this.CurrentApplicationID = null;
         // {string} uuid
         // The current ABApplication.id we are working with.

         // {ui_common_list} instance to display a list of our objects.
         this.ListComponent = new UI_COMMON_LIST({
            idBase: this.ids.component,
            labels: {
               addNew: "Add new query",
               confirmDeleteTitle: "Delete Query",
               title: "Queries",
               searchPlaceholder: "Query name",
            },
            // we can overrid the default template like this:
            // templateListItem:
            //    "<div class='ab-object-list-item'>#label##warnings#{common.iconGear}</div>",
            menu: {
               copy: false,
               exclude: true,
            },
         });
         this.AddForm = UIListNewQuery(AB);
      }

      // Our webix UI definition:
      ui() {
         return this.ListComponent.ui();
      }

      // Our init() function for setting up our UI
      async init(AB, options) {
         this.AB = AB;

         this.on("addNew", (selectNew) => {
            // if we receive a signal to add a new Query from another source
            this.clickNewQuery(selectNew);
         });

         //
         // List of Processes
         //
         var allInits = [];
         allInits.push(this.ListComponent.init(AB));

         this.ListComponent.on("selected", (item) => {
            this.emit("selected", item);
         });

         this.ListComponent.on("addNew", (selectNew) => {
            this.clickNewQuery(selectNew);
         });

         this.ListComponent.on("deleted", (item) => {
            this.emit("deleted", item);
         });

         this.ListComponent.on("exclude", (item) => {
            this.exclude(item);
         });

         //
         // Add Form
         //
         allInits.push(this.AddForm.init(AB));

         this.AddForm.on("cancel", () => {
            this.AddForm.hide();
         });

         this.AddForm.on("save", (q /*, select */) => {
            // the AddForm already takes care of updating the
            // CurrentApplication.

            // we just need to update our list of objects
            this.applicationLoad(this.CurrentApplication);

            // if (select) {
            this.ListComponent.select(q.id);
            // }
         });

         await Promise.all(allInits);
      }

      /**
       * @function applicationLoad
       * Initialize the List from the provided ABApplication
       * If no ABApplication is provided, then show an empty form. (create operation)
       * @param {ABApplication} application
       *        [optional] The current ABApplication we are working with.
       */
      applicationLoad(application) {
         this.CurrentApplicationID = application.id;

         this.ListComponent.dataLoad(application?.queriesIncluded());

         this.AddForm.applicationLoad(application);
      }

      /**
       * @method CurrentApplication
       * return the current ABApplication being worked on.
       * @return {ABApplication} application
       */
      get CurrentApplication() {
         return this.AB.applicationByID(this.CurrentApplicationID);
      }

      /*
       * @function exclude
       * the list component notified us of an exclude action and which
       * item was chosen.
       *
       * perform the removal and update the UI.
       */
      async exclude(item) {
         this.ListComponent.busy();
         var app = this.CurrentApplication;
         await app.queryRemove(item);
         this.ListComponent.dataLoad(app.queriesIncluded());

         // this will clear the  workspace
         this.emit("selected", null);
      }

      ready() {
         this.ListComponent.ready();
      }

      /**
       * @function clickNewQuery
       *
       * Manages initiating the transition to the new Process Popup window
       */
      clickNewQuery(selectNew) {
         // show the new popup
         this.AddForm.show();
      }

      /**
       * @function exclude
       * the list component notified us of an exclude action and which
       * item was chosen.
       *
       * perform the removal and update the UI.
       */
      async exclude(item) {
         this.ListComponent.busy();
         await this.CurrentApplication.queryRemove(item);
         this.ListComponent.dataLoad(this.CurrentApplication.queriesIncluded());

         // this will clear the object workspace
         this.emit("selected", null);
      }
   }

   return new UI_Work_Query_List();
}
