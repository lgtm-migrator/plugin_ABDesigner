/*
 * ui_work_interface_list
 *
 * Manage the ABInterface List
 *
 */

import UIListNewProcess from "./ui_work_interface_list_newPage";

//import UI_Work_Interface_List_NewPage from "./ui_work_interface_list_newPage";
import UI_Common_PopupEditMenu from "./ui_common_popupEditMenu";

// const ABProcess = require("../classes/platform/ABProcess");

export default function (AB) {
   var PopupEditPageComponent = new UI_Common_PopupEditMenu(AB);
  //  var PopupNewPageComponent = new UIListNewProcess(AB);

  var AddForm = new UIListNewProcess(AB);
  // the popup form for adding a new process

   const uiConfig = AB.Config.uiSettings();
   var L = function (...params) {
      return AB.Multilingual.labelPlugin("ABDesigner", ...params);
    };


   class UI_Work_Interface_List extends AB.ClassUI {
      constructor() {
        var base = "ui_work_interface_list"
        super({
          component: base,
          list: `${base}_editList`,
          buttonNew: `${base}_buttonNew`
        });

        this.EditPopup = new PopupEditPageComponent(base);

        //   idBase: this.ids.component,
        //   labels: {
        //      addNew: "Add new page",
        //      confirmDeleteTitle: "Delete Page",
        //      title: "Pages",
        //      searchPlaceholder: "Page name",
        //   },
        //   // we can overrid the default template like this:
        //   // templateListItem:
        //   //    "<div class='ab-object-list-item'>#label##warnings#{common.iconGear}</div>",
        //   menu: {
        //      copy: true,
        //      exclude: false,
        //   },
        // });
        this.CurrentApplication = null;
        var processList = null;

        this.viewList = new webix.TreeCollection();
      }

      // Our webix UI definition:
      ui() {
        var ids = this.ids;
        // Our webix UI definition:
        return {
          id: ids.component,
          rows: [
            {
                view: "unitlist",
                uniteBy: L("Pages"),
                height: 34,
                data: [" "],
                type: {
                  height: 0,
                  headerHeight: 35
                }
            },
            {
                view: AB._App.custom.edittree.view, // "edittree",
                id: ids.list,
                width: uiConfig.columnWidthLarge,

                select: true,

                editaction: "custom",
                editable: true,
                editor: "text",
                editValue: "label",
                css: "ab-tree-ui",

                template: (obj, common) => {
                  return this.templateListItem(obj, common);
                },
                type: {
                  iconGear: "<span class='webix_icon fa fa-cog'></span>"
                },
                on: {
                  onAfterRender: () => {
                      this.onAfterRender();
                  },
                  onAfterSelect: (id) => {
                      this.onAfterSelect(id);
                  },
                  onAfterOpen: () => {
                      this.onAfterOpen();
                  },
                  onAfterClose: () => {
                      this.onAfterClose();
                  },
                  onBeforeEditStop: (state, editor) => {
                      this.onBeforeEditStop(state, editor);
                  },
                  onAfterEditStop: (state, editor, ignoreUpdate) => {
                      this.onAfterEditStop(state, editor, ignoreUpdate);
                  }
                },
                onClick: {
                  "ab-page-list-edit": (e, id, trg) => {
                      this.clickEditMenu(e, id, trg);
                  }
                }
            },
            {
                view: "button",
                css: "webix_primary",
                id: ids.buttonNew,
                css: "webix_primary",
                type: "form",
                value: L("Add new Page"),//labels.component.addNew,
                click: () => {
                  console.log("clickNewView")
                  this.emit("clickNewView")
                }
            }
          ]
      };
        // Making custom UI settings above
        // return this.ListComponent.ui();
      }

      // Our init() function for setting up our UI
      async init(AB, options) {
         this.AB = AB;

         this.on("clickNewView", (selectNew) => {
            // if we receive a signal to add a new Interface from another source
            // like the blank interface workspace offering an Add New button:
            this.clickNewView(selectNew);
         });


         if ($$(this.ids.component)) $$(this.ids.component).adjust();

         let $List = $$(this.ids.list);

         if ($List) {
            webix.extend($List, webix.ProgressBar);
            $List.data.unsync();
            $List.data.sync(this.viewList);
            $List.adjust();
         }

        await AddForm.init(AB);

        AddForm.on("cancel", () => {
           AddForm.hide();
        });

        await this.EditPopup.init(AB, {
          onClick: this.callbackPageEditMenu,
          // onClick: {
          //   "ab-interface-list-edit": (e, id, trg) => {
          //      this.callbackPageEditMenu(e, id, trg);
          //   }},
          hideExclude: true
        });

        this.EditPopup.menuOptions ( [
          {
             label: L("Rename"),
             icon: "fa fa-pencil-square-o",
             command: "rename",
          },
          {
             label: L("Copy"),
             icon: "fa fa-files-o",
             command: "copy",
          },
          {
             label: L("Delete"),
             icon: "fa fa-trash",
             command: "delete",
          },
        ]);

        this.EditPopup.on("delete", (item) => {
          this.remove(item);
        });

        this.EditPopup.on("copy", (data) => {
          this.copy(data);
        });

        this.EditPopup.on("rename", () => {
          this.rename();
        });

        await AddForm.init(AB);

        AddForm.on("cancel", () => {
          AddForm.hide();
        });

        AddForm.on("save", (obj, select) => {
          // the PopupEditPageComponent already takes care of updating the
          // CurrentApplication.

          // we just need to update our list of interfaces
          this.applicationLoad(this.CurrentApplication);

          // if (select) {
          this.ListComponent.select(obj.id);
          // }
        });

        this._handler_refreshApp = (def) => {
          this.CurrentApplication = this.CurrentApplication.refreshInstance();
          this.applicationLoad(this.CurrentApplication);
        };
      }

      addNew() {
         console.error("!! Who is calling this?");
         this.clickNewView(true);
      }

      /**
       * @function applicationLoad
       * Initialize the List from the provided ABApplication
       * If no ABApplication is provided, then show an empty form. (create operation)
       * @param {ABApplication} application
       *        [optional] The current ABApplication we are working with.
       */
      applicationLoad(application) {
         var events = ["definition.updated", "definition.deleted"];
         if (this.CurrentApplication) {
            // remove current handler
            events.forEach((e) => {
               console.log(this._handler_refreshApp) // always undefined
              //  this.CurrentApplication.removeListener(
              //     e,
              //     this._handler_refreshApp
              //  );
            });
         }
         this.CurrentApplication = application;
         if (this.CurrentApplication) {
            events.forEach((e) => {
               console.log(this._handler_refreshApp)
               // this.CurrentApplication.on(e, this._handler_refreshApp);
            });
         }

         // TODO list pages
         console.log(application?.pages())
         // this.ListComponent.dataLoad(application?.pages());

          this.busy();
          // this so it looks right/indented in a tree view:
          this.viewList.clearAll();

          var addPage = (page, index, parentId) => {
            if (!page) return;

            this.viewList.add(page, index, parentId);

            page.pages().forEach((childPage, childIndex) => {
                addPage(childPage, childIndex, page.id);
            });
          };
          application.pages().forEach((p, index) => {
            addPage(p, index);
          });

          // clear our list and display our objects:
          var List = $$(this.ids.list);
          List.refresh();
          List.unselectAll();

          //
          this.ready();

          // // prepare our Popup with the current Application
          AddForm.applicationLoad(application);
          // this.EditPopup.applicationLoad(application);
      }

      /**
       * @function callbackNewProcess
       *
       * Once a New Process was created in the Popup, follow up with it here.
       */
      // callbackNewProcess(err, interface, selectNew, callback) {
      //    debugger;
      //    if (err) {
      //       OP.Error.log("Error creating New Process", { error: err });
      //       return;
      //    }

      //    let interfaces = this.CurrentApplication.interfaces();
      //    processList.parse(interfaces);

      //    // if (processList.exists(interface.id))
      //    // 	processList.updateItem(interface.id, interface);
      //    // else
      //    // 	processList.add(interface);

      //    if (selectNew != null && selectNew == true) {
      //       $$(ids.list).select(interface.id);
      //    } else if (callback) {
      //       callback();
      //    }
      // }

      /**
       * @function clickNewView
       *
       * Manages initiating the transition to the new Page Popup window
       */
      clickNewView(selectNew) {
         // show the new popup
         AddForm.show();
      }

      /*
       * @function copy
       * the list component notified us of a copy action and has
       * given us the new data for the copied item.
       *
       * now our job is to create a new instance of that Item and
       * tell the list to display it
       */
      copy(data) {
         debugger;
         this.ListComponent.busy();

         this.CurrentApplication.processCreate(data.item).then((newProcess) => {
            this.ListComponent.ready();
            this.ListComponent.dataLoad(this.CurrentApplication.processes());
            this.ListComponent.select(newProcess.id);
         });
      }

      showGear (id) {
        var domNode = $$(this.ids.list).getItemNode(id);
        if (domNode) {
           var gearIcon = domNode.querySelector(".ab-page-list-edit");
           gearIcon.style.visibility = "visible";
           gearIcon.style.display = "block";
        }
      }
      /**
      * @function show()
      *
      * Show this component.
      */
      show () {
        $$(this.ids.component).show();
      }

      ready() {
        let ids = this.ids;
        //this.ListComponent.ready();
        if ($$(ids.list) && $$(ids.list).hideProgress)
        $$(ids.list).hideProgress();
      }
      busy() {
        let ids = this.ids;
        if ($$(ids.list) && $$(ids.list).showProgress)
           $$(ids.list).showProgress({ type: "icon" });
      }
      refreshTemplateItem(view) {
        // make sure this item is updated in our list:
        view = view.updateIcon(view);
        viewList.updateItem(view.id, view);
      }
      rename () {
        var pageID = $$(this.ids.list).getSelectedId(false);
        $$(this.ids.list).edit(pageID);
      }
      /*
       * @function copy
       * make a copy of the current selected item.
       *
       * copies should have all the same .toObj() data,
       * but will need unique names, and ids.
       *
       * we start the process by making a copy and then
       * having the user enter a new label/name for it.
       *
       * our .afterEdit() routines will detect it is a copy
       * then alert the parent UI component of the "copied" data
       *
       * @param {obj} selectedItem the currently selected item in
       * 		our list.
       */
      copy () {
        let selectedPage = $$(this.ids.list).getSelectedItem(false);

        // show loading cursor
        this.listBusy();

        // get a copy of the page
        selectedPage
           .copy(null, selectedPage.parent)
           .then((copiedPage) => {
              // copiedPage.parent = selectedPage.parent;
              // copiedPage.label = copiedPage.label + " (copied)";
              // copiedPage.save().then(() => {
              this.callbackNewPage(copiedPage);
              this.listReady();
              // });
           })
           .catch((err) => {
              var strError = err.toString();
              webix.alert({
                 title: "Error copying page",
                 ok: "fix it",
                 text: strError,
                 type: "alert-error"
              });
              console.log(err);
              this.listReady();
           });
      }
      remove () {
        var selectedPage = $$(this.ids.list).getSelectedItem(false);
        if (!selectedPage) return;

        // verify they mean to do this:
        webix.confirm({
          title: L("Delete Page"),
          text: L("Are you sure you wish to delete this page?", [selectedPage.label]),
          ok: L("Yes"),
          cancel: L("No"),
          callback: async (isOK) => {
             if (isOK) {
                this.busy();

                try {
                   await selectedPage.destroy();
                   this.ready();
                   $$(this.ids.list).remove(selectedPage.id);

                   // let the calling component know about
                   // the deletion:
                   this.emit("deleted", selectedPage);

                   // clear object workspace
                   this.emit("selected", null);
                } catch (e) {
                   console.error(e, {
                      context: "ui_common_list:remove(): error removing item",
                   });
                   this.ready();
                }
             }
          },
        });
      }
      /**
      * @function callbackPageEditMenu
      *
      * Respond to the edit menu selection.
      */
      callbackPageEditMenu (action) {
        switch (action) {
           case "rename":
              this.rename();
              break;
           case "copy":
              this.copy();
              break;
           case "delete":
              this.remove();
              break;
        }
      }
      clickEditMenu (e, id, trg) {
        // Show menu
        this.EditPopup.show(trg);

        return false;
      }
      /**
      * @function callbackNewObject
      *
      * Once a New Page was created in the Popup, follow up with it here.
      */
      callbackNewPage (page) {
        var parentPage = page.pageParent();
        var parentPageId = parentPage.id != page.id ? parentPage.id : null;
        if (!viewList.exists(page.id))
           viewList.add(page, null, parentPageId);

        // add sub-pages to tree-view
        page.pages().forEach((p, index) => {
           if (!viewList.exists(p.id)) viewList.add(p, index, page.id);
        });

        $$(this.ids.list).refresh();

        if (parentPageId) $$(this.ids.list).open(parentPageId);

        $$(this.ids.list).select(page.id);

        AddForm.hide();
      }
      listBusy () {
        if ($$(this.ids.list) && $$(this.ids.list).showProgress)
           $$(this.ids.list).showProgress({ type: "icon" });
      }

      listReady () {
          if ($$(this.ids.list) && $$(this.ids.list).hideProgress)
            $$(this.ids.list).hideProgress();
      }

      templateListItem(item, common) {
        var template = `<div class='ab-page-list-item'>
            ${common.icon(item)} <span class='webix_icon fa fa-${item.icon || item.viewIcon()}'></span> ${item.label} <div class='ab-page-list-edit'>${common.iconGear}</div>
            </div>`

        // now register a callback to update this display when this view is updated:
        item
           .removeListener("properties.updated", this.refreshTemplateItem)
           .once("properties.updated", this.refreshTemplateItem);

        return template
      }
      onAfterOpen () {
        var id = $$(this.ids.list).getSelectedId(false);
        if (id) {
           this.showGear(id);
        }
      }

      onAfterRender () {
          var id = $$(this.ids.list).getSelectedId(false);
          if (id) {
            this.showGear(id);
          }
      }

      /**
        * @function onAfterSelect()
        *
        * Perform these actions when a View is selected in the List.
        */
      onAfterSelect (id) {
          var view = $$(this.ids.list).getItem(id);
          //AB.actions.populateInterfaceWorkspace(view);

          this.showGear(id);
      }
      onBeforeEditStop(state /*, editor */) {
        console.log(state)
        var selectedItem = $$(this.ids.list).getSelectedItem(false);
        selectedItem.label = state.value;

        // if this item supports isValid()
        if (selectedItem.isValid) {
           var validator = selectedItem.isValid();
           if (validator.fail()) {
              selectedItem.label = state.old;

              return false; // stop here.
           }
        }

        return true;
      }
      onAfterEditStop (state, editor, ignoreUpdate) {
        this.showGear(editor.id);

        if (state.value != state.old) {
           this.listBusy();

           var selectedPage = $$(this.ids.list).getSelectedItem(false);
           selectedPage.label = state.value;

           // Call server to rename
           selectedPage
              .save()
              .then( () => {
                 this.listReady();

                 // refresh the root page list
                 AddForm.applicationLoad(CurrentApplication);

                 // TODO : should use message box
                 webix.alert({
                    text: L("<b>{0}</b> is renamed.", [state.value])
                 });
              })
              .catch(function() {
                this.listReady();

                webix.alert({
                   text: L("System could not rename <b>{0}</b>.", [state.value])
                });
             })
        }
      }
      onAfterClose () {
        var selectedIds = $$(this.ids.list).getSelectedId(true);

        // Show gear icon
        selectedIds.forEach((id) => {
           this.showGear(id);
        });
      }

      // Expose any globally accessible Actions:
      // this.actions({
      //    /**
      //     * @function getSelectedProcess
      //     *
      //     * returns which ABProcess is currently selected.
      //     * @return {ABProcess}  or {null} if nothing selected.
      //     */
      //    getSelectedProcess: function () {
      //       return $$(this.ids.list).getSelectedItem();
      //    },

      //    addNewProcess: function (selectNew, callback) {
      //       _logic.clickNewView(selectNew, callback);
      //    },
      // });
   }
   return new UI_Work_Interface_List();
}
