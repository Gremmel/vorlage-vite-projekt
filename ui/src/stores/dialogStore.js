import { defineStore } from 'pinia';

export const useDialogStore = defineStore('dialogStore', {
  state: () => ({
    showDialog: false,
    dialogTitle: '',
    dialogMessage: '',
    okButtonText: 'OK',
    cancelButtonText: 'Abbrechen',
    okButtonClass:'btn-primary',
    cancelButtonClass:'btn-secondary',
    okFunction: null
  }),

  getters: {
    isShowDialog: (state) => !!state.showDialog,
  },

  actions: {
    openDeleteDialog (title, message, okFunction) {
      this.dialogTitle = title;
      this.dialogMessage = message;
      this.okButtonText = 'Löschen';
      this.okButtonClass = 'btn-danger';
      this.cancelButtonText = 'Abbrechen';
      this.cancelButtonClass = 'btn-secondary';
      this.okFunction = okFunction;
      this.showDialog = true;
    },

    setParameter (title, message, okButtonText, okButtonClass, cancelButtonText, cancelButtonClass, okFunction) {
      this.dialogTitle = title;
      this.dialogMessage = message;
      this.okButtonText = okButtonText;
      this.okButtonClass = okButtonClass;
      this.cancelButtonText = cancelButtonText;
      this.cancelButtonClass = cancelButtonClass;
      this.okFunction = okFunction;
      this.showDialog = true;
    },
  },
});
