import { DynamicStructuredTool, DynamicTool } from "@langchain/core/tools";
import { z } from "zod";

const setCurrentEditorText = new DynamicStructuredTool({
  name: "set_current_editor_text",
  description: "Sets the current editor text",
  schema: z.object({
    text: z.string().describe("The new value to set for the current editor"),
    cursorPos: z
      .number()
      .nullable()
      .describe(
        "Where to set the new value. `undefined` or 0 is selectAll, -1 is at the document start, and 1 is at the end",
      ),
  }),
  func: async ({ text, cursorPos }) => {
    try {
      editorManager.editor.setValue(text, cursorPos);
    } catch (e) {
      return `Failed to set current editor text: ${e}`;
    }
  },
});

const getActiveFileUri = new DynamicTool({
  name: "get_active_file_uri",
  description: "Returns the file uri of active file or opened file in the editor or null if no file is opened in the editor.",
  func: async (input) => {
    return editorManager.activeFile?.uri ? editorManager.activeFile.uri : null;
  }
});

export {
  setCurrentEditorText,
  getActiveFileUri
};
