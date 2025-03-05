var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => DailyFileLogger
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  diaryFolder: "\u65E5\u8BB0",
  dailyCreatedSectionTitle: "## \u5F53\u65E5\u521B\u5EFA\u6587\u4EF6",
  dailyEditedSectionTitle: "## \u5F53\u65E5\u7F16\u8F91\u6587\u4EF6",
  diaryFileFormat: "YYYY-MM-DD",
  excludedFolders: [],
  enableDebug: false,
  diaryTemplatePath: ""
};
var DailyFileLogger = class extends import_obsidian.Plugin {
  settings;
  async onload() {
    await this.loadSettings();
    setTimeout(() => {
      this.registerEvent(
        this.app.vault.on("create", (file) => this.logFile(file, "create"))
      );
      this.registerEvent(
        this.app.vault.on("modify", (file) => this.logFile(file, "modify"))
      );
      this.debugLog("Daily File Logger events registered");
    }, 1e3);
    this.addSettingTab(new DailyFileLoggerSettingTab(this.app, this));
    this.debugLog("Daily File Logger loaded");
  }
  debugLog(message, ...args) {
    if (this.settings.enableDebug) {
      console.log(`[Daily File Logger] ${message}`, ...args);
    }
  }
  getFormattedDate() {
    const format = this.settings.diaryFileFormat || "YYYY-MM-DD";
    return window.moment().format(format);
  }
  isFileExcluded(file) {
    const filePath = file.path;
    return this.settings.excludedFolders.some(
      (folder) => filePath.startsWith(folder.endsWith("/") ? folder : `${folder}/`)
    );
  }
  async getTemplateContent() {
    if (!this.settings.diaryTemplatePath) {
      return "";
    }
    const templateFile = this.app.vault.getAbstractFileByPath(this.settings.diaryTemplatePath);
    if (templateFile instanceof import_obsidian.TFile) {
      return await this.app.vault.read(templateFile);
    }
    this.debugLog("Template file not found:", this.settings.diaryTemplatePath);
    return "";
  }
  async logFile(file, eventType) {
    if (!(file instanceof import_obsidian.TFile) || file.extension !== "md") return;
    if (this.isFileExcluded(file)) return;
    const diaryFolder = this.settings.diaryFolder;
    const formattedDate = this.getFormattedDate();
    const diaryPath = `${diaryFolder}/${formattedDate}.md`;
    if (file.path === diaryPath) {
      this.debugLog("Skipping diary file:", diaryPath);
      return;
    }
    const fileName = file.basename;
    const createdSectionTitle = this.settings.dailyCreatedSectionTitle;
    const editedSectionTitle = this.settings.dailyEditedSectionTitle;
    const time = (/* @__PURE__ */ new Date()).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
    try {
      this.debugLog(`Processing ${eventType} event for file:`, file.path);
      let diaryFile = this.app.vault.getAbstractFileByPath(diaryPath);
      let diaryContent = "";
      this.debugLog("Checking diary file:", diaryPath, "Exists:", !!diaryFile);
      if (diaryFile instanceof import_obsidian.TFile) {
        diaryContent = await this.app.vault.read(diaryFile);
      } else {
        const templateContent = await this.getTemplateContent();
        diaryContent = templateContent || `# ${formattedDate.split("/").pop()} \u65E5\u8BB0
${createdSectionTitle}

${editedSectionTitle}
`;
        const folderPath = diaryPath.substring(0, diaryPath.lastIndexOf("/"));
        if (!this.app.vault.getAbstractFileByPath(folderPath)) {
          await this.app.vault.createFolder(folderPath);
          this.debugLog("Created diary folder:", folderPath);
        }
      }
      const createSectionIndex = diaryContent.indexOf(createdSectionTitle);
      const editSectionIndex = diaryContent.indexOf(editedSectionTitle);
      let headerContent = "";
      let createContent = "";
      let editContent = "";
      if (createSectionIndex === -1 && editSectionIndex === -1) {
        headerContent = diaryContent.trim() || `# ${formattedDate.split("/").pop()} \u65E5\u8BB0`;
        createContent = "";
        editContent = "";
      } else if (createSectionIndex === -1) {
        headerContent = diaryContent.substring(0, editSectionIndex).trim();
        editContent = diaryContent.substring(editSectionIndex).trim();
      } else if (editSectionIndex === -1) {
        headerContent = diaryContent.substring(0, createSectionIndex).trim();
        createContent = diaryContent.substring(createSectionIndex).trim();
      } else {
        if (createSectionIndex < editSectionIndex) {
          headerContent = diaryContent.substring(0, createSectionIndex).trim();
          createContent = diaryContent.substring(createSectionIndex, editSectionIndex).trim();
          editContent = diaryContent.substring(editSectionIndex).trim();
        } else {
          headerContent = diaryContent.substring(0, editSectionIndex).trim();
          editContent = diaryContent.substring(editSectionIndex, createSectionIndex).trim();
          createContent = diaryContent.substring(createSectionIndex).trim();
        }
      }
      if (eventType === "create") {
        if (createContent.indexOf(`[[${fileName}]]`) === -1) {
          createContent = createContent.trim() || createdSectionTitle;
          createContent += `
- [[${fileName}]] (${time} created)
`;
        } else {
          this.debugLog("Create entry already exists:", fileName);
          return;
        }
      }
      if (eventType === "modify") {
        const createPattern = new RegExp(`- \\[\\[${fileName}\\]\\] \\(\\d{2}:\\d{2} created\\)`);
        const mergedPattern = new RegExp(`- \\[\\[${fileName}\\]\\] \\(\\d{2}:\\d{2} created\\)(?: \\| \\(\\d{2}:\\d{2} edited\\))?`);
        if (createContent && createPattern.test(createContent)) {
          const createMatch = createContent.match(createPattern);
          if (createMatch && createMatch[0]) {
            const createTimeMatch = createMatch[0].match(/(\d{2}:\d{2})/);
            if (createTimeMatch && createTimeMatch[0]) {
              const createTime = createTimeMatch[0];
              const createTimestamp = /* @__PURE__ */ new Date();
              createTimestamp.setHours(parseInt(createTime.split(":")[0]), parseInt(createTime.split(":")[1]));
              const editTimestamp = /* @__PURE__ */ new Date();
              const timeDiff = (editTimestamp.getTime() - createTimestamp.getTime()) / (1e3 * 60);
              if (timeDiff < 1) {
                this.debugLog("Edit time within 1 minute of creation, skipping:", fileName);
              } else {
                const mergedEntry = `- [[${fileName}]] (${createTime} created) | (${time} edited)`;
                createContent = createContent.replace(mergedPattern, mergedEntry);
                this.debugLog("Merged create and edit times for:", fileName);
              }
            }
          }
        } else {
          editContent = editContent.trim() || editedSectionTitle;
          const editPattern = new RegExp(`- \\[\\[${fileName}\\]\\] \\(\\d{2}:\\d{2} edited\\)`);
          if (editContent.indexOf(`[[${fileName}]]`) === -1) {
            editContent += `
- [[${fileName}]] (${time} edited)
`;
          } else {
            editContent = editContent.replace(editPattern, `- [[${fileName}]] (${time} edited)`);
          }
        }
      }
      diaryContent = `${headerContent}

${createContent || createdSectionTitle}

${editContent || editedSectionTitle}
`;
      if (diaryFile instanceof import_obsidian.TFile) {
        this.debugLog("Modifying diary file:", diaryPath);
        await this.app.vault.modify(diaryFile, diaryContent);
      } else {
        this.debugLog("Attempting to create diary file:", diaryPath);
        const existingFile = this.app.vault.getAbstractFileByPath(diaryPath);
        if (!existingFile) {
          await this.app.vault.create(diaryPath, diaryContent);
          this.debugLog("Diary file created:", diaryPath);
        } else if (existingFile instanceof import_obsidian.TFile) {
          this.debugLog("File exists after check, modifying:", diaryPath);
          await this.app.vault.modify(existingFile, diaryContent);
        }
      }
    } catch (error) {
      this.debugLog("Error in Daily File Logger:", error);
    }
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  onunload() {
    this.debugLog("Daily File Logger unloaded");
  }
};
var DailyFileLoggerSettingTab = class extends import_obsidian.PluginSettingTab {
  plugin;
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("\u65E5\u8BB0\u6587\u4EF6\u5939").setDesc("\u8BBE\u7F6E\u65E5\u8BB0\u6587\u4EF6\u7684\u5B58\u653E\u6587\u4EF6\u5939").addText((text) => text.setPlaceholder("\u65E5\u8BB0").setValue(this.plugin.settings.diaryFolder).onChange(async (value) => {
      this.plugin.settings.diaryFolder = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u5F53\u65E5\u521B\u5EFA\u6587\u4EF6\u6807\u9898").setDesc("\u8BBE\u7F6E\u65E5\u8BB0\u4E2D\u5F53\u5929\u521B\u5EFA\u6587\u4EF6\u7684\u6807\u9898\uFF08\u9700\u5305\u542B\u6807\u9898\u7EA7\u522B\uFF0C\u5982 ##\uFF09").addText((text) => text.setPlaceholder("## \u5F53\u65E5\u521B\u5EFA\u6587\u4EF6").setValue(this.plugin.settings.dailyCreatedSectionTitle).onChange(async (value) => {
      this.plugin.settings.dailyCreatedSectionTitle = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u5F53\u65E5\u7F16\u8F91\u6587\u4EF6\u6807\u9898").setDesc("\u8BBE\u7F6E\u65E5\u8BB0\u4E2D\u5F53\u5929\u7F16\u8F91\u6587\u4EF6\u7684\u6807\u9898\uFF08\u9700\u5305\u542B\u6807\u9898\u7EA7\u522B\uFF0C\u5982 ##\uFF09").addText((text) => text.setPlaceholder("## \u5F53\u65E5\u7F16\u8F91\u6587\u4EF6").setValue(this.plugin.settings.dailyEditedSectionTitle).onChange(async (value) => {
      this.plugin.settings.dailyEditedSectionTitle = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u65E5\u8BB0\u6587\u4EF6\u540D\u683C\u5F0F").setDesc("\u8BBE\u7F6E\u65E5\u8BB0\u6587\u4EF6\u8DEF\u5F84\u548C\u540D\u79F0\u7684\u683C\u5F0F\uFF08\u652F\u6301 moment.js \u683C\u5F0F\uFF0C\u4F8B\u5982 YYYY-MM-DD \u6216 YYYY/MM/YYYY-MM-DD\uFF0C\u7559\u7A7A\u9ED8\u8BA4 YYYY-MM-DD\uFF09").addText((text) => text.setPlaceholder("YYYY-MM-DD").setValue(this.plugin.settings.diaryFileFormat).onChange(async (value) => {
      this.plugin.settings.diaryFileFormat = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u65E5\u8BB0\u6A21\u677F\u8DEF\u5F84").setDesc("\u8BBE\u7F6E\u65E5\u8BB0\u6A21\u677F\u6587\u4EF6\u8DEF\u5F84\uFF08\u9996\u6B21\u521B\u5EFA\u65E5\u8BB0\u65F6\u4F7F\u7528\uFF0C\u7559\u7A7A\u5219\u4F7F\u7528\u9ED8\u8BA4\u683C\u5F0F\uFF09").addText((text) => text.setPlaceholder("Templates/DiaryTemplate.md").setValue(this.plugin.settings.diaryTemplatePath).onChange(async (value) => {
      this.plugin.settings.diaryTemplatePath = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u6392\u9664\u7684\u6587\u4EF6\u5939").setDesc("\u8F93\u5165\u4E0D\u5E0C\u671B\u8BB0\u5F55\u5230\u65E5\u8BB0\u7684\u6587\u4EF6\u5939\u8DEF\u5F84\uFF08\u6BCF\u884C\u4E00\u4E2A\uFF0C\u4F8B\u5982 Templates/ \u6216 Notes/Private/\uFF09").addTextArea((text) => text.setPlaceholder("Templates/\nNotes/Private/").setValue(this.plugin.settings.excludedFolders.join("\n")).onChange(async (value) => {
      this.plugin.settings.excludedFolders = value.split("\n").filter((line) => line.trim() !== "");
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u542F\u7528\u8C03\u8BD5\u65E5\u5FD7").setDesc("\u5F00\u542F\u540E\u5728\u63A7\u5236\u53F0\u8F93\u51FA\u8BE6\u7EC6\u65E5\u5FD7\uFF0C\u4FBF\u4E8E\u6392\u67E5\u95EE\u9898").addToggle((toggle) => toggle.setValue(this.plugin.settings.enableDebug).onChange(async (value) => {
      this.plugin.settings.enableDebug = value;
      await this.plugin.saveSettings();
    }));
  }
};
