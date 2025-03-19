import { Plugin, TAbstractFile, TFile, App, PluginSettingTab, Setting } from 'obsidian';

interface Settings {
  diaryFolder: string;
  dailyCreatedSectionTitle: string;
  dailyEditedSectionTitle: string;
  diaryFileFormat: string;
  excludedFolders: string[];
  enableDebug: boolean;
  diaryTemplatePath: string;
}

const DEFAULT_SETTINGS: Settings = {
  diaryFolder: '日记',
  dailyCreatedSectionTitle: '## 当日创建文件',
  dailyEditedSectionTitle: '## 当日编辑文件',
  diaryFileFormat: 'YYYY-MM-DD',
  excludedFolders: [],
  enableDebug: false,
  diaryTemplatePath: ''
};

export default class DailyFileLogger extends Plugin {
  settings: Settings;

  async onload() {
    await this.loadSettings();
    setTimeout(() => {
      this.registerEvent(
        this.app.vault.on('create', (file) => this.logFile(file, 'create'))
      );
      this.registerEvent(
        this.app.vault.on('modify', (file) => this.logFile(file, 'modify'))
      );
      this.debugLog('Daily File Logger events registered');
    }, 1000);
    this.addSettingTab(new DailyFileLoggerSettingTab(this.app, this));
    this.debugLog('Daily File Logger loaded');
  }

  debugLog(message: string, ...args: any[]): void {
    if (this.settings.enableDebug) {
      console.log(`[Daily File Logger] ${message}`, ...args);
    }
  }

  getFormattedDate(): string {
    const format = this.settings.diaryFileFormat || 'YYYY-MM-DD';
    return window.moment().format(format);
  }

  isFileExcluded(file: TFile): boolean {
    const filePath = file.path;
    return this.settings.excludedFolders.some(folder =>
      filePath.startsWith(folder.endsWith('/') ? folder : `${folder}/`)
    );
  }

  async getTemplateContent(): Promise<string> {
    if (!this.settings.diaryTemplatePath) {
      return '';
    }
    const templateFile = this.app.vault.getAbstractFileByPath(this.settings.diaryTemplatePath);
    if (templateFile instanceof TFile) {
      return await this.app.vault.read(templateFile);
    }
    this.debugLog('Template file not found:', this.settings.diaryTemplatePath);
    return '';
  }

  async logFile(file: TAbstractFile, eventType: 'create' | 'modify') {
    if (!(file instanceof TFile) || file.extension !== 'md') return;

    if (this.isFileExcluded(file)) return;

    const diaryFolder = this.settings.diaryFolder;
    const formattedDate = this.getFormattedDate();
    const diaryPath = `${diaryFolder}/${formattedDate}.md`;

    if (file.path === diaryPath) {
      this.debugLog('Skipping diary file:', diaryPath);
      return;
    }

    const fileName = file.basename;
    const createdSectionTitle = this.settings.dailyCreatedSectionTitle;
    const editedSectionTitle = this.settings.dailyEditedSectionTitle;
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });

    try {
      this.debugLog(`Processing ${eventType} event for file:`, file.path);
      let diaryFile = this.app.vault.getAbstractFileByPath(diaryPath);
      let diaryContent = '';

      this.debugLog('Checking diary file:', diaryPath, 'Exists:', !!diaryFile);
      if (diaryFile instanceof TFile) {
        diaryContent = await this.app.vault.read(diaryFile);
      } else {
        const templateContent = await this.getTemplateContent();
        diaryContent = templateContent || `# ${formattedDate.split('/').pop()} 日记\n${createdSectionTitle}\n\n${editedSectionTitle}\n`;
        const folderPath = diaryPath.substring(0, diaryPath.lastIndexOf('/'));
        if (!this.app.vault.getAbstractFileByPath(folderPath)) {
          await this.app.vault.createFolder(folderPath);
          this.debugLog('Created diary folder:', folderPath);
        }
      }

      // 拆分日记内容以确保标题顺序
      const createSectionIndex = diaryContent.indexOf(createdSectionTitle);
      const editSectionIndex = diaryContent.indexOf(editedSectionTitle);
      let headerContent = '';
      let createContent = '';
      let editContent = '';

      if (createSectionIndex === -1 && editSectionIndex === -1) {
        // 两个标题都不存在，使用默认结构
        headerContent = diaryContent.trim() || `# ${formattedDate.split('/').pop()} 日记`;
        createContent = '';
        editContent = '';
      } else if (createSectionIndex === -1) {
        // 只有编辑标题
        headerContent = diaryContent.substring(0, editSectionIndex).trim();
        editContent = diaryContent.substring(editSectionIndex).trim();
      } else if (editSectionIndex === -1) {
        // 只有创建标题
        headerContent = diaryContent.substring(0, createSectionIndex).trim();
        createContent = diaryContent.substring(createSectionIndex).trim();
      } else {
        // 两个标题都存在
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

      // 处理创建事件
      if (eventType === 'create') {
        if (createContent.indexOf(`[[${fileName}]]`) === -1) {
          createContent = createContent.trim() || createdSectionTitle;
          createContent += `\n- [[${fileName}]] (${time} created)\n`;
        } else {
          this.debugLog('Create entry already exists:', fileName);
          return;
        }
      }

      // 处理编辑事件
      if (eventType === 'modify') {
        // 检查是否是当天创建的文件
        const createPattern = new RegExp(`- \\[\\[${fileName}\\]\\] \\(\\d{2}:\\d{2} created\\)`);
        const mergedPattern = new RegExp(`- \\[\\[${fileName}\\]\\] \\(\\d{2}:\\d{2} created\\)(?: \\| \\(\\d{2}:\\d{2} edited\\))?`);

        if (createContent && createPattern.test(createContent)) {
          const createMatch = createContent.match(createPattern);
          if (createMatch && createMatch[0]) {
            const createTimeMatch = createMatch[0].match(/(\d{2}:\d{2})/);
            if (createTimeMatch && createTimeMatch[0]) {
              const createTime = createTimeMatch[0];
              const createTimestamp = new Date();
              createTimestamp.setHours(parseInt(createTime.split(':')[0]), parseInt(createTime.split(':')[1]));
              const editTimestamp = new Date();
              const timeDiff = (editTimestamp.getTime() - createTimestamp.getTime()) / (1000 * 60);

              if (timeDiff < 1) {
                this.debugLog('Edit time within 1 minute of creation, skipping:', fileName);
              } else {
                const mergedEntry = `- [[${fileName}]] (${createTime} created) | (${time} edited)`;
                createContent = createContent.replace(mergedPattern, mergedEntry);
                this.debugLog('Merged create and edit times for:', fileName);
              }
            }
          }
        } else {
          // 非当天创建的文件，记录到编辑部分
          editContent = editContent.trim() || editedSectionTitle;
          const editPattern = new RegExp(`- \\[\\[${fileName}\\]\\] \\(\\d{2}:\\d{2} edited\\)`);
          if (editContent.indexOf(`[[${fileName}]]`) === -1) {
            editContent += `\n- [[${fileName}]] (${time} edited)\n`;
          } else {
            editContent = editContent.replace(editPattern, `- [[${fileName}]] (${time} edited)`);
          }
        }
      }

      // 重新组合内容，确保创建部分在编辑部分之前
      diaryContent = `${headerContent}\n\n${createContent || createdSectionTitle}\n\n${editContent || editedSectionTitle}\n`;

      if (diaryFile instanceof TFile) {
        this.debugLog('Modifying diary file:', diaryPath);
        await this.app.vault.modify(diaryFile, diaryContent);
      } else {
        this.debugLog('Attempting to create diary file:', diaryPath);
        const existingFile = this.app.vault.getAbstractFileByPath(diaryPath);
        if (!existingFile) {
          await this.app.vault.create(diaryPath, diaryContent);
          this.debugLog('Diary file created:', diaryPath);
        } else if (existingFile instanceof TFile) {
          this.debugLog('File exists after check, modifying:', diaryPath);
          await this.app.vault.modify(existingFile, diaryContent);
        }
      }
    } catch (error) {
      this.debugLog('Error in Daily File Logger:', error);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {
    this.debugLog('Daily File Logger unloaded');
  }
}

class DailyFileLoggerSettingTab extends PluginSettingTab {
  plugin: DailyFileLogger;

  constructor(app: App, plugin: DailyFileLogger) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('日记文件夹')
      .setDesc('设置日记文件的存放文件夹')
      .addText(text => text
        .setPlaceholder('日记')
        .setValue(this.plugin.settings.diaryFolder)
        .onChange(async (value) => {
          this.plugin.settings.diaryFolder = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('当日创建文件标题')
      .setDesc('设置日记中当天创建文件的标题（需包含标题级别，如 ##）')
      .addText(text => text
        .setPlaceholder('## 当日创建文件')
        .setValue(this.plugin.settings.dailyCreatedSectionTitle)
        .onChange(async (value) => {
          this.plugin.settings.dailyCreatedSectionTitle = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('当日编辑文件标题')
      .setDesc('设置日记中当天编辑文件的标题（需包含标题级别，如 ##）')
      .addText(text => text
        .setPlaceholder('## 当日编辑文件')
        .setValue(this.plugin.settings.dailyEditedSectionTitle)
        .onChange(async (value) => {
          this.plugin.settings.dailyEditedSectionTitle = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('日记文件名格式')
      .setDesc('设置日记文件路径和名称的格式（支持 moment.js 格式，例如 YYYY-MM-DD 或 YYYY/MM/YYYY-MM-DD，留空默认 YYYY-MM-DD）')
      .addText(text => text
        .setPlaceholder('YYYY-MM-DD')
        .setValue(this.plugin.settings.diaryFileFormat)
        .onChange(async (value) => {
          this.plugin.settings.diaryFileFormat = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('日记模板路径')
      .setDesc('设置日记模板文件路径（首次创建日记时使用，留空则使用默认格式）')
      .addText(text => text
        .setPlaceholder('Templates/DiaryTemplate.md')
        .setValue(this.plugin.settings.diaryTemplatePath)
        .onChange(async (value) => {
          this.plugin.settings.diaryTemplatePath = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('排除的文件夹')
      .setDesc('输入不希望记录到日记的文件夹路径（每行一个，例如 Templates/ 或 Notes/Private/）')
      .addTextArea(text => text
        .setPlaceholder('Templates/\nNotes/Private/')
        .setValue(this.plugin.settings.excludedFolders.join('\n'))
        .onChange(async (value) => {
          this.plugin.settings.excludedFolders = value.split('\n').filter(line => line.trim() !== '');
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('启用调试日志')
      .setDesc('开启后在控制台输出详细日志，便于排查问题')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableDebug)
        .onChange(async (value) => {
          this.plugin.settings.enableDebug = value;
          await this.plugin.saveSettings();
        }));
  }
}
