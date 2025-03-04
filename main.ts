import { Plugin, TAbstractFile, TFile, App, PluginSettingTab, Setting } from 'obsidian';

interface Settings {
  diaryFolder: string;
  dailyCreatedSectionTitle: string;
  dailyEditedSectionTitle: string;
  diaryFileFormat: string;
  excludedFolders: string[];
  enableDebug: boolean;
  diaryTemplatePath: string; // 新增模板路径设置
}

const DEFAULT_SETTINGS: Settings = {
  diaryFolder: '日记',
  dailyCreatedSectionTitle: '## 当日创建文件',
  dailyEditedSectionTitle: '## 当日编辑文件',
  diaryFileFormat: 'YYYY-MM-DD',
  excludedFolders: [],
  enableDebug: false,
  diaryTemplatePath: '' // 默认空模板路径
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
        // 如果日记不存在，使用模板
        const templateContent = await this.getTemplateContent();
        diaryContent = templateContent || `# ${formattedDate.split('/').pop()} 日记\n${createdSectionTitle}\n\n${editedSectionTitle}\n`;
        const folderPath = diaryPath.substring(0, diaryPath.lastIndexOf('/'));
        if (!this.app.vault.getAbstractFileByPath(folderPath)) {
          await this.app.vault.createFolder(folderPath);
          this.debugLog('Created diary folder:', folderPath);
        }
      }

      // 处理创建事件
      if (eventType === 'create') {
        const createSectionIndex = diaryContent.indexOf(createdSectionTitle);
        if (createSectionIndex === -1) {
          diaryContent += `\n${createdSectionTitle}\n- [[${fileName}]] (${time} created)\n`;
        } else {
          const createTitleEnd = createSectionIndex + createdSectionTitle.length;
          const createContentAfterTitle = diaryContent.substring(createTitleEnd);
          if (!createContentAfterTitle.includes(`[[${fileName}]]`)) {
            diaryContent = diaryContent.substring(0, createTitleEnd) + '\n' + 
              `- [[${fileName}]] (${time} created)\n` + createContentAfterTitle.trim();
          } else {
            this.debugLog('Create entry already exists:', fileName);
            return;
          }
        }
      }

      // 处理编辑事件
      if (eventType === 'modify') {
        const createSectionIndex = diaryContent.indexOf(createdSectionTitle);
        const editSectionIndex = diaryContent.indexOf(editedSectionTitle);

        if (createSectionIndex !== -1) {
          const createTitleEnd = createSectionIndex + createdSectionTitle.length;
          const nextSectionIndex = diaryContent.indexOf('## ', createTitleEnd);
          const sectionEnd = nextSectionIndex !== -1 ? nextSectionIndex : diaryContent.length;
          const createContentAfterTitle = diaryContent.substring(createTitleEnd, sectionEnd);

          const createPattern = new RegExp(`- \\[\\[${fileName}\\]\\] \\(\\d{2}:\\d{2} created\\)`);
          const mergedPattern = new RegExp(`- \\[\\[${fileName}\\]\\] \\(\\d{2}:\\d{2} created\\)(?: \\| \\(\\d{2}:\\d{2} edited\\))?`);

          if (createPattern.test(createContentAfterTitle)) {
            const createMatch = createContentAfterTitle.match(createPattern);
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
                  diaryContent = diaryContent.replace(mergedPattern, mergedEntry);
                  this.debugLog('Merged create and edit times for:', fileName);
                }
              }
            }
          } else if (editSectionIndex !== -1) {
            const editTitleEnd = editSectionIndex + editedSectionTitle.length;
            const editNextSectionIndex = diaryContent.indexOf('## ', editTitleEnd);
            const editSectionEnd = editNextSectionIndex !== -1 ? editNextSectionIndex : diaryContent.length;
            const editContentAfterTitle = diaryContent.substring(editTitleEnd, editSectionEnd);
            const editPattern = new RegExp(`- \\[\\[${fileName}\\]\\] \\(\\d{2}:\\d{2} edited\\)`);

            if (!editContentAfterTitle.includes(`[[${fileName}]]`)) {
              diaryContent = diaryContent.substring(0, editTitleEnd) + '\n' + 
                `- [[${fileName}]] (${time} edited)\n` + editContentAfterTitle.trim() + 
                diaryContent.substring(editSectionEnd);
            } else {
              diaryContent = diaryContent.substring(0, editTitleEnd) + 
                editContentAfterTitle.replace(editPattern, `- [[${fileName}]] (${time} edited)`) + 
                diaryContent.substring(editSectionEnd);
            }
          } else {
            diaryContent += `\n${editedSectionTitle}\n- [[${fileName}]] (${time} edited)\n`;
          }
        }
      }

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
