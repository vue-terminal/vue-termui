declare global {
  var document: {
    title: string
    createElement: () => {}
    querySelector: () => {}
    querySelectorAll: () => []
  }
  var VUE_DEVTOOLS_CONFIG: {
    openInEditorHost: string
  }
}

export {}
