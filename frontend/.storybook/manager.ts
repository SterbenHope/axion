import { addons } from "@storybook/manager-api"
import { themes } from "@storybook/theming"

addons.setConfig({
  theme: themes.dark,
  selectedPanel: "storybook/actions/panel",
  initialActive: "sidebar",
  showNav: true,
  showPanel: true,
  panelPosition: "bottom",
  enableShortcuts: true,
  showToolbar: true,
  selectedTool: "zoom",
  initialStory: "Introduction",
  sidebar: {
    showRoots: true,
    collapsedRoots: ["other"],
  },
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
  },
})
