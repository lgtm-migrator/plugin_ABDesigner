/*
 * ABViewDetail
 * A Property manager for our ABViewDetail definitions
 */

import FABViewContainer from "./ABViewContainer";

export default function (AB) {
   const ABViewContainer = FABViewContainer(AB);
   const uiConfig = AB.Config.uiSettings();
   const L = ABViewContainer.L();

   let ABViewDetailPropertyComponentDefaults = {};

   const base = "properties_abview_detail";

   class ABViewDetailProperty extends ABViewContainer {
      constructor() {
         super(base, {
            // Put our ids here
            datacollection: "",
            fields: "",
            showLabel: "",
            labelPosition: "",
            labelWidth: "",
            height: "",
         });

         this.AB = AB;
         ABViewDetailPropertyComponentDefaults =
            this.AB.Class.ABViewManager.viewClass("detail").defaultValues();
      }

      static get key() {
         return "detail";
      }

      ui() {
         let ids = this.ids;

         return super.ui([
            {
               id: ids.datacollection,
               name: "datacollection",
               view: "richselect",
               label: L("Data Source"),
               labelWidth: uiConfig.labelWidthLarge,
               skipAutoSave: true,
               on: {
                  onChange: (newId, oldId) => {
                     this.selectSource(newId, oldId);
                  },
               },
            },
            {
               id: ids.fields,
               name: "fields",
               view: "list",
               select: false,
               minHeight: 200,
               template: this.listTemplate,
               type: {
                  markCheckbox: function (item) {
                     return (
                        "<span class='check webix_icon fa fa-" +
                        (item.selected ? "check-" : "") +
                        "square-o'></span>"
                     );
                  },
               },
               onClick: {
                  check: (...params) => this.check(...params),
               },
            },
            {
               id: ids.showLabel,
               name: "showLabel",
               view: "checkbox",
               label: L("Display Label"),
               labelWidth: uiConfig.labelWidthLarge,
            },
            {
               id: ids.labelPosition,
               name: "labelPosition",
               view: "richselect",
               label: L("Label Position"),
               labelWidth: uiConfig.labelWidthLarge,
               options: [
                  {
                     id: "left",
                     value: L("Left"),
                  },
                  {
                     id: "top",
                     value: L("Top"),
                  },
               ],
               on: {
                  onChange: () => {
                     this.onChange();
                  },
               },
            },
            {
               id: ids.labelWidth,
               name: "labelWidth",
               view: "counter",
               label: L("Label Width"),
               labelWidth: uiConfig.labelWidthLarge,
               on: {
                  onChange: () => {
                     this.onChange();
                  },
               },
            },
            {
               id: ids.height,
               name: "height",
               view: "counter",
               label: L("Height:"),
               labelWidth: uiConfig.labelWidthLarge,
               on: {
                  onChange: () => {
                     this.onChange();
                  },
               },
            },
         ]);
      }

      populate(view) {
         super.populate(view);
         if (!view) return;

         let ids = this.ids;

         let datacollectionId = view.settings?.dataviewID;
         let SourceSelector = $$(ids.datacollection);

         // Pull data collections to options
         let dcOptions = view.application
            .datacollectionsIncluded()
            .filter((dc) => {
               let obj = dc.datasource;
               return dc.sourceType == "object" && obj && !obj.isImported;
            })
            .map((d) => {
               let entry = { id: d.id, value: d.label };
               if (d.sourceType == "query") {
                  entry.icon = "fa fa-filter";
               } else {
                  entry.icon = "fa fa-database";
               }
               return entry;
            });
         SourceSelector.define("options", dcOptions);
         SourceSelector.define("value", datacollectionId);
         SourceSelector.refresh();

         this.propertyUpdateFieldOptions(datacollectionId, view);

         $$(ids.showLabel).setValue(
            view.settings.showLabel ??
               ABViewDetailPropertyComponentDefaults.showLabel
         );
         $$(ids.labelPosition).setValue(
            view.settings.labelPosition ??
               ABViewDetailPropertyComponentDefaults.labelPosition
         );
         $$(ids.labelWidth).setValue(
            parseInt(view.settings.labelWidth) ??
               ABViewDetailPropertyComponentDefaults.labelWidth
         );
         $$(ids.height).setValue(
            view.settings.height >= 0
               ? view.settings.height
               : ABViewDetailPropertyComponentDefaults.height
         );

         // update properties when a field component is deleted
         view?.views().forEach((v) => {
            if (v instanceof this.AB.Class.ABViewDetailItem)
               v.once("destroyed", () => this.populate(view));
         });
      }

      defaultValues() {
         let values = {};
         let ViewClass = this.ViewClass();
         if (ViewClass) {
            values = ViewClass.defaultValues();
         }
         return values;
      }

      /**
       * @method values
       * return the values for this form.
       * @return {obj}
       */
      values() {
         let ids = this.ids;
         let vals = super.values();

         vals.settings = vals.settings || {};
         vals.settings.dataviewID = $$(ids.datacollection).getValue();
         vals.settings.showLabel = $$(ids.showLabel).getValue();
         vals.settings.labelPosition = $$(ids.labelPosition).getValue();
         vals.settings.labelWidth = $$(ids.labelWidth).getValue();
         vals.settings.height = $$(ids.height).getValue();

         return vals;
      }

      /**
       * @method FieldClass()
       * A method to return the proper ABViewXXX Definition.
       * NOTE: Must be overwritten by the Child Class
       */
      ViewClass() {
         return super._ViewClass("detail");
      }

      /**
       * @method propertyUpdateFieldOptions
       * Populate fields of object to select list in property
       *
       * @param {string} dcId - id of ABDatacollection
       */
      propertyUpdateFieldOptions(dcId, view) {
         const ids = this.ids;
         let datacollection = this.AB.datacollections((dc) => dc.id == dcId)[0];
         let object = datacollection?.datasource;

         // Pull field list
         let fieldOptions = object?.fields().map((f) => {
            f.selected =
               view?.views((com) => f.id == com.settings.fieldId).length > 0;

            return f;
         });

         $$(ids.fields).clearAll();
         $$(ids.fields).parse(fieldOptions ?? []);
      }

      selectSource(dcId) {
         const ids = this.ids;
         // _logic.busy();

         let currView = this.CurrentView;

         currView.settings.dataviewID = dcId;

         // clear sub views
         let viewsToRemove = currView._views;
         currView._views = [];

         return (
            Promise.resolve()
               // remove all old field components
               .then(() => {
                  let allRemoves = [];
                  viewsToRemove.forEach((v) => {
                     allRemoves.push(v.destroy());
                  });
                  return Promise.all(allRemoves);
               })
               // refresh UI
               .then(() => {
                  // currView.emit('properties.updated', currView);

                  // _logic.busy();

                  // Update field options in property
                  this.propertyUpdateFieldOptions(dcId);

                  // add all fields to editor by default
                  if (currView._views.length > 0) return Promise.resolve();

                  let saveTasks = [];
                  let fields = $$(ids.fields).find({});
                  fields.reverse();
                  fields.forEach((f, index) => {
                     if (!f.selected) {
                        let yPosition = fields.length - index - 1;

                        // Add new form field
                        let newFieldView = currView.addFieldToDetail(
                           f,
                           yPosition
                        );
                        if (newFieldView) {
                           newFieldView.once("destroyed", () =>
                              this.populate(currView)
                           );

                           // // Call save API
                           saveTasks.push(newFieldView.save());
                        }

                        // update item to UI list
                        f.selected = 1;
                        $$(ids.fields).updateItem(f.id, f);
                     }
                  });

                  return Promise.all(saveTasks);
               })
               // Saving
               .then(() => {
                  return currView.save();
               })
               // Finally
               .then(() => {
                  let detailView = currView.parentDetailComponent();
                  detailView?.emit("properties.updated", currView);

                  // _logic.ready();
                  this.onChange();
                  return Promise.resolve();
               })
         );
      }

      listTemplate(field, common) {
         return (
            common.markCheckbox(field) +
            " #label#".replace("#label#", field.label)
         );
      }

      check(e, fieldId) {
         const ids = this.ids;
         let currView = this.CurrentView;
         let detailView = currView.parentDetailComponent();

         // update UI list
         let item = $$(ids.fields).getItem(fieldId);
         item.selected = item.selected ? 0 : 1;
         $$(ids.fields).updateItem(fieldId, item);

         let doneFn = () => {
            // refresh UI
            currView.emit("properties.updated", currView);
            this.onChange();
         };

         // add a field to the form
         if (item.selected) {
            let fieldView = currView.addFieldToDetail(item);
            if (fieldView) {
               fieldView.save().then(() => {
                  fieldView.once("destroyed", () => this.populate(currView));
                  currView.viewInsert(fieldView).then(() => {
                     doneFn();
                  });
               });
            }
         }
         // remove field in the form
         else {
            let fieldView = detailView.views(
               (c) => c.settings.fieldId == fieldId
            )[0];

            if (fieldView) {
               fieldView.destroy();
               currView.viewRemove(fieldView).then(() => {
                  doneFn();
               });
            }
         }
      }
   }

   return ABViewDetailProperty;
}
