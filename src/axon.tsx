import type { WCPage } from "acode/editor/page";
import plugin from "../plugin.json";
import { Options } from "acode/acode";
import App from "./App";
import "./axon.css";
import { createRoot } from "react-dom/client";
import * as React from "react";
import CryptoJS from "crypto-js";

const fs = acode.require("fs");

export type AxonSettings = {
  llm: string;
  apiKey?: string;
};

export type AxonProps = {
  settings: AxonSettings;
};

class Axon {
  public baseUrl: string;
  public dataDirectory: string;
  public settings: AxonSettings;

  constructor() {
    // @ts-expect-error cordova
    this.dataDirectory = cordova.file.dataDirectory;
    this.loadSettings().then(() => {});
  }

  async init($page: WCPage, options: Options) {
    await this.loadSettings();
    // @ts-expect-error settitle
    $page.settitle("Axon");

    const { commands } = editorManager.editor;

    commands.addCommand({
      name: "Axon",
      exec: async () => {
        $page.innerHTML = `
          <link rel="stylesheet" href="${this.baseUrl}axon.css" />
          <div id="axon-chat-root" class="overflow-hidden w-full h-full"></div>
        `;

        requestAnimationFrame(() => {
          const container = document.getElementById("axon-chat-root");
          if (!container) {
            console.error("Container not found!");
            return;
          }

          createRoot(container).render(
            React.createElement(App, { settings: this.settings }),
          );
        });
        $page.show();
      },
    });
  }

  async destroy() {
    const { commands } = editorManager.editor;
    commands.removeCommand("Axon");

    const file = fs(this.dataDirectory + "/axon_settings.json");
    if (await file.exists()) {
      await file.delete();
    }
  }

  private SECRET_KEY = "axon-secret-!@#$%^&*2345678965i76ryuivcxdjnfghjnc";

  private encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, this.SECRET_KEY).toString();
  }

  private decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, this.SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  async saveSettings() {
    const filesystem = fs(this.dataDirectory);
    const file = fs(this.dataDirectory + "/axon_settings.json");

    if (this.settings.apiKey) {
      const encrypted = this.encrypt(this.settings.apiKey);
      const toSave = { ...this.settings, apiKey: encrypted };
      if (!(await file.exists())) {
        await filesystem.createFile(
          "axon_settings.json",
          JSON.stringify(toSave),
        );
      } else {
        await file.writeFile(JSON.stringify(toSave));
      }
      console.log("Axon Settings saved (API key encrypted).");
    } else {
      if (!(await file.exists())) {
        await filesystem.createFile(
          "axon_settings.json",
          JSON.stringify(this.settings),
        );
      } else {
        await file.writeFile(JSON.stringify(this.settings));
      }
      console.log("Axon Settings saved.");
    }
  }

  async loadSettings() {
    try {
      const json = await fs(
        this.dataDirectory + "/axon_settings.json",
      ).readFile("utf-8");
      const loaded = JSON.parse(json) as AxonSettings;
      if (loaded.apiKey) {
        loaded.apiKey = this.decrypt(loaded.apiKey);
      }
      this.settings = loaded;
    } catch (err) {
      console.warn("No settings file found, using defaults:", err);
      this.settings = { llm: "gemini" };
    }
  }
}

if (window.acode) {
  const axon = new Axon();
  acode.setPluginInit(
    plugin.id,
    async (baseUrl: string, $page: WCPage, options: Options) => {
      axon.baseUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
      await axon.init($page, options);
    },
    {
      list: [
        {
          key: "language-model",
          text: "Language Model",
          value: localStorage.getItem("axon-llm") || "gemini",
          select: [
            ["groq", "Groq"],
            ["openai", "OpenAI"],
            ["anthropic", "Anthropic"],
            ["gemini", "Google Gemini"],
            // ["fireworks", "Fireworks AI"],
            ["mistral", "Mistral AI"],
            // ["vertex", "Google Vertex AI"],
          ],
        },
        {
          key: "api-key",
          text: "API Key",
          prompt: "Enter your API key",
          promptType: "text",
        },
      ],
      cb: async (key, value) => {
        if (key === "language-model") {
          localStorage.setItem("axon-llm", value as string);

          axon.settings.llm = value as string;
          await axon.saveSettings();
          acode.pushNotification("Saved", "Language model saved successfully", {
            type: "success",
            icon: "check",
            autoClose: true,
          });
        } else if (key === "api-key") {
          axon.settings.apiKey = value as string;
          await axon.saveSettings();
          acode.pushNotification("Saved", "API key saved successfully", {
            type: "success",
            icon: "check",
            autoClose: true,
          });
        } else {
          window.toast("Unknown option selected", 3000);
        }
      },
    },
  );

  acode.setPluginUnmount(plugin.id, async () => {
    await axon.destroy();
  });
}
