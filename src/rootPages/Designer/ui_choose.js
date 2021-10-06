/*
 * UI Choose
 *
 * Display the initial options of Applications we can work with.
 *
 * When choosing an initial application to work with, we can
 *   - select an application from a list  :  ab_choose_list
 *   - create an application from a form  :  ab_choose_form
 *
 */

import AB_Choose_List_Factory from "./ui_choose_list";
import AB_Choose_Form_Factory from "./ui_choose_form";

export default function (AB) {
   const AppList = AB_Choose_List_Factory(AB);
   const AppForm = AB_Choose_Form_Factory(AB);

   class UIChoose extends AB.ClassUI {
      constructor() {
         super("abd_choose");
      }

      ui() {
         return {
            id: this.ids.component,
            view: "multiview",
            animate: false,
            cells: [AppList.ui(), AppForm.ui()],
         };
      }

      async init(AB) {
         this.AB = AB;

         AppList.on("view.workplace", (App) => {
            this.emit("view.workplace", App);
         });

         AppList.on("view.form", () => {
            AppForm.formReset();
            AppForm.show();
         });

         AppList.on("edit.form", (app) => {
            AppForm.formPopulate(app);
            AppForm.show();
         });

         AppForm.on("view.list", () => {
            AppList.show();
         });
         return Promise.all([AppList.init(AB), AppForm.init(AB)]);
      }

      show() {
         super.show();
         AppList.show();
      }
   }
   return new UIChoose();
}
