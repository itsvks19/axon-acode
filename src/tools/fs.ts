import { fs } from "@/axon.tsx";
import { DynamicStructuredTool, DynamicTool } from "@langchain/core/tools";
import { z } from "zod";

const readFile = new DynamicStructuredTool({
  name: "read_file",
  description: "Read contents of a file from acode file system using its uri",
  schema: z.object({
    uri: z.string().describe("Valid uri of the file"),
  }),
  func: async ({ uri }) => {
    try {
      return await fs(uri).readFile("utf-8");
    } catch (e) {
      return `Failed to read file: ${e}`;
    }
  }
});

const writeFile = new DynamicStructuredTool({
  name: "write_file",
  description: "Write file via uri of file using acode file system",
  schema: z.object({
    uri: z.string().describe("Valid uri of the file"),
    content: z.string().describe("File contents to write"),
  }),
  func: async ({ uri, content }) => {
    try {
      return await fs(uri).writeFile(content);
    } catch (e) {
      return `Failed to write file: ${e}`;
    }
  }
});

const getFileName = new DynamicStructuredTool({
  name: "get_file_name",
  description: "Returns the name of the file by its uri",
  schema: z.object({
    uri: z.string().describe("Valid uri of the file")
  }),
  func: async ({ uri }) => {
    try {
      const stat = await fs(uri).stat();
      return stat.name;
    } catch (e) {
      return `Failed to read file: ${e}`;
    }
  }
});

const getOpenedFileUris = new DynamicTool({
  name: "get_opened_file_uris",
  description: "Returns the Uri(s) of currently opened files in the editor",
  func: async (input) => {
    return editorManager.files.map((file) => file.uri);
  }
});

export {
  readFile, writeFile,
  getFileName, getOpenedFileUris
};
