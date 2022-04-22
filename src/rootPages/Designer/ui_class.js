/*
 * ui_class
 *
 * A common UI object for our UI pages.
 *

 */

var myClass = null;
// {singleton}
// we will want to call this factory fn() repeatedly in our imports,
// but we only want to define 1 Class reference.

export default function (AB) {
   if (!myClass) {
      myClass = class UI extends AB.ClassUI {
         constructor(...params) {
            super(...params);

            this.AB = AB;
            // {ABFactory}
            // Our common ABFactory for our application.

            this.CurrentApplicationID = null;
            // {string} uuid
            // The current ABApplication.id we are working with.

            this.CurrentObjectID = null;
            // {string}
            // the ABObject.id of the object we are working with.

            this.CurrentProcessID = null;
            // {string}
            // the ABProcess.id of the process we are working with.

            this.CurrentQueryID = null;
            // {string}
            // the ABObjectQuery.id of the query we are working with.

            this.CurrentDatacollectionID = null;
            // {string}
            // the ABDataCollection.id of the datacollection we are working with.
         }

         static L() {
            return function (...params) {
               return AB.Multilingual.labelPlugin("ABDesigner", ...params);
            };
         }

         /**
          * @method CurrentApplication
          * return the current ABApplication being worked on.
          * @return {ABApplication} application
          */
         get CurrentApplication() {
            return this.AB.applicationByID(this.CurrentApplicationID);
         }

         /**
          * @function applicationLoad
          * save the ABApplication.id of the current application.
          * @param {ABApplication} app
          */
         applicationLoad(app) {
            this.CurrentApplicationID = app?.id;
         }

         objectLoad(obj) {
            this.CurrentObjectID = obj?.id;
         }

         processLoad(process) {
            this.CurrentProcessID = process?.id;
         }

         queryLoad(query) {
            this.CurrentQueryID = query?.id;
         }

         datacollectionLoad(dc) {
            this.CurrentDatacollectionID = dc?.id;

            this.CurrentDatacollection = this.AB.datacollectionByID(
               this.CurrentDatacollectionID
            );
         }

         /**
          * @method CurrentObject()
          * A helper to return the current ABObject we are working with.
          * @return {ABObject}
          */
         get CurrentObject() {
            let obj = this.AB.objectByID(this.CurrentObjectID);
            if (!obj) {
               obj = this.AB.queryByID(this.CurrentObjectID);
            }
            return obj;
         }

         /**
          * @method CurrentProcess()
          * A helper to return the current ABProcess we are working with.
          * @return {ABProcess}
          */
         get CurrentProcess() {
            return this.AB.processByID(this.CurrentProcessID);
         }

         /**
          * @method CurrentQuery()
          * A helper to return the current ABObjectQuery we are working with.
          * @return {ABObjectQuery}
          */
         get CurrentQuery() {
            return this.AB.queryByID(this.CurrentQueryID);
         }

         /**
          * @method refreshWarnings()
          * reset the warnings on the provided ABObject and then start propogating
          * the "warnings" display updates.
          */
         warningsRefresh(ABObject) {
            ABObject.warningsEval();
            this.emit("warnings");
         }

         /**
          * @method warningsPropogate()
          * If any of the passed in ui elements issue a "warnings" event, we will
          * propogate that upwards.
          */
         warningsPropogate(elements = []) {
            elements.forEach((e) => {
               e.on("warnings", () => {
                  this.emit("warnings");
               });
            });
         }
      };
   }

   return myClass;
}
