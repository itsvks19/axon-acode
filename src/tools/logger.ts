import { tool } from "@langchain/core/tools";
import { z } from "zod";

const logTool = tool(
  async ({ data }) => {
    console.log(data)
  },
  {
    name: "log",
    description: "Log anything in the console",
    schema: z.object({
      data: z.any().nullable().describe("The data to log")
    })
  }
)

export { logTool };
