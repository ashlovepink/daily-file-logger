# Daily File Logger

![Obsidian](https://img.shields.io/badge/Obsidian-插件-blueviolet) ![版本](https://img.shields.io/badge/版本-1.0.0-brightgreen) ![许可证](https://img.shields.io/badge/许可证-MIT-green)

## 软件介绍

**Daily File Logger** 是一个 Obsidian 插件，用于自动记录每日创建和编辑的文件。它会在指定文件夹中生成每日日记文件，帮助你轻松追踪笔记的变化。

![image](https://github.com/ashlovepink/daily-file-logger/blob/main/DEMO.gif)

### 功能亮点

- 📅 **每日日志**：自动生成格式化的日记文件（如 `2025-03-03.md`）。  
- ✍️ **文件跟踪**：  
  - 记录当天创建的文件（带时间戳）。  
  - 记录当天编辑的文件（可合并创建和编辑时间）。  
- ⚙️ **高度可定制**：  
  - 自定义日记文件夹路径。  
  - 设置日记文件名格式（支持 `moment.js`）。  
  - 指定日记模板。  
  - 排除特定文件夹。  
- 🛠️ **调试支持**：启用调试日志，便于排查问题。

---

## 使用案例

以下是插件的几个典型使用场景，帮助你了解如何使用：

### 案例 1：追踪项目进度
- **场景**：你在 Obsidian 中管理项目，想记录每天的笔记活动。  
- **设置参数**：  
  - 日记文件夹：`Projects/Diary`  
  - 当日创建文件标题：`## 当日创建`  
  - 当日编辑文件标题：`## 当日编辑`  
  - 日记文件名格式：`YYYY-MM-DD`  
  - 排除的文件夹：（空）  
  - 启用调试：否  
  - 日记模板路径：`Templates/ProjectDiary.md`  
- **模板** (`Templates/ProjectDiary.md`)：  
  - 说明：这是一个纯 Markdown 文件，`{{date}}` 是用户手动写入的占位符，插件会将其替换为当前日期（例如 `2025-03-03`）。  
{{date}} 项目日记
今日目标
 完成任务A
当日创建
当日编辑

- **操作**：  
  - 09:30 创建 `Meeting Notes.md`。  
  - 10:15 编辑 `Meeting Notes.md`。  
  - 14:00 编辑 `Task List.md`。  
- **结果** (`Projects/Diary/2025-03-03.md`)：  
2025-03-03 项目日记
今日目标
 完成任务A
当日创建
[[Meeting Notes]] (09:30 created)
当日编辑
[[Meeting Notes]] (09:30 created) | (10:15 edited)
[[Task List]] (14:00 edited)

- **用途**：结合每日目标，回顾项目笔记进展。

### 案例 2：学习笔记管理
- **场景**：你用 Obsidian 记录学习笔记，想自动跟踪每天的学习内容。  
- **设置参数**：  
  - 日记文件夹：`日记`  
  - 当日创建文件标题：`## 新笔记`  
  - 当日编辑文件标题：`## 更新笔记`  
  - 日记文件名格式：`YYYY/MM/DD`  
  - 排除的文件夹：`Templates/`  
  - 启用调试：是  
  - 日记模板路径：（空）  
- **操作**：  
  - 13:45 创建 `Python Basics.md`。  
  - 15:20 编辑 `Python Basics.md`。  
- **结果** (`日记/2025/03/03.md`)：  
2025-03-03 日记
新笔记
[[Python Basics]] (13:45 created)
更新笔记
[[Python Basics]] (13:45 created) | (15:20 edited)

- **用途**：追踪学习进度，文件夹嵌套更清晰。

### 案例 3：排除私人笔记
- **场景**：你想记录笔记但排除私人文件。  
- **设置参数**：  
  - 日记文件夹：`DailyLogs`  
  - 当日创建文件标题：`## 创建文件`  
  - 当日编辑文件标题：`## 编辑文件`  
  - 日记文件名格式：`YYYY-MM-DD`  
  - 排除的文件夹：`Private/, Secrets/`  
  - 启用调试：否  
  - 日记模板路径：`Templates/SimpleDiary.md`  
- **模板** (`Templates/SimpleDiary.md`)：  
  - 说明：`{{date}}` 是用户手动写入的占位符，插件会替换为当前日期。  
{{date}} 日记
创建文件
编辑文件

- **操作**：  
  - 10:00 创建 `Work Plan.md`。  
  - 10:05 创建 `Private/Personal.md`。  
  - 11:00 编辑 `Work Plan.md`。  
- **结果** (`DailyLogs/2025-03-03.md`)：  
2025-03-03 日记
创建文件
[[Work Plan]] (10:00 created)
编辑文件
[[Work Plan]] (10:00 created) | (11:00 edited)

- **用途**：确保私人笔记不被记录。

---

## 使用方法

1. **安装插件**：  
   - **从 Obsidian 社区插件商店**：  
     1. 打开 Obsidian。  
     2. 进入 **设置 > 社区插件**。  
     3. 点击 **浏览**，搜索 “Daily File Logger”，安装并启用。  
   - **手动安装**：  
     1. 从 [GitHub Releases](https://github.com/<your-username>/daily-file-logger/releases) 下载 `main.js` 和 `manifest.json`。  
     2. 复制到 `<你的 vault>/.obsidian/plugins/daily-file-logger/`。  
     3. 在 **设置 > 社区插件** 中启用。  

2. **配置设置**：  
   - 前往 **设置 > 社区插件 > Daily File Logger**。  
   - 根据需要调整参数（见下文）。  

3. **开始使用**：  
   - 创建或编辑 Markdown 文件，插件会自动记录。  
   - 查看日记文件（如 `日记/2025-03-03.md`）。  

---

## 设置参数详解

以下是每个设置参数的详细说明：

- **日记文件夹**：  
  - **描述**：指定日记文件的存储位置。  
  - **默认值**：`日记`  
  - **示例**：`Projects/Diary`（嵌套文件夹），`DailyLogs`  
- **当日创建文件标题**：  
  - **描述**：记录当天创建文件的标题。  
  - **默认值**：`## 当日创建文件`  
  - **示例**：`## 新笔记`，`## 创建文件`  
- **当日编辑文件标题**：  
  - **描述**：记录当天编辑文件的标题。  
  - **默认值**：`## 当日编辑文件`  
  - **示例**：`## 更新笔记`，`## 编辑文件`  
- **日记文件名格式**：  
  - **描述**：定义日记文件名称/路径格式，支持 `moment.js`。  
  - **默认值**：`YYYY-MM-DD`（如 `2025-03-03.md`）  
  - **示例**：`YYYY/MM/DD`（如 `2025/03/03.md`），`YYYY-MM`（如 `2025-03.md`）  
- **排除的文件夹**：  
  - **描述**：不记录的文件夹路径（每行一个）。  
  - **默认值**：（空）  
  - **示例**：`Private/, Templates/`（排除 `Private/` 和 `Templates/`）  
- **启用调试**：  
  - **描述**：启用后在开发者控制台输出详细日志。  
  - **默认值**：`false`  
  - **示例**：`true`（用于调试）  
- **日记模板路径**：  
  - **描述**：首次创建日记时使用的模板文件路径。  
  - **默认值**：（空）  
  - **示例**：`Templates/DiaryTemplate.md`  

---

## 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

*有问题或建议？请通过 [Issues](https://github.com/<your-username>/daily-file-logger/issues) 联系我！*
