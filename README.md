# Daily File Logger

[中文文档](README_CN.md)

![Obsidian](https://img.shields.io/badge/Obsidian-Plugin-blueviolet) ![Version](https://img.shields.io/badge/Version-1.0.0-brightgreen) ![License](https://img.shields.io/badge/License-MIT-green)

## Introduction

**Daily File Logger** is an Obsidian plugin that automatically logs files created and modified each day. It generates daily diary entries in a specified folder, helping you track changes to your notes effortlessly.

![image](https://github.com/ashlovepink/daily-file-logger/blob/main/assets/demo.gif)

### Features

- 📅 **Daily Logs**: Automatically creates formatted diary files (e.g., `2025-03-03.md`).  
- ✍️ **File Tracking**:  
  - Logs files created on the current day with timestamps.  
  - Logs files edited on the current day, merging creation and edit times when applicable.  
- ⚙️ **Highly Customizable**:  
  - Customize diary folder path.  
  - Set diary file name format (supports `moment.js` formatting).  
  - Specify a diary template.  
  - Exclude specific folders from logging.  
- 🛠️ **Debug Support**: Enable debug logging for troubleshooting.

---

## Usage Examples

Below are detailed examples of how to use the plugin in different scenarios:

### Example 1: Project Progress Tracking
- **Scenario**: You're managing a project in Obsidian and want to track daily note activities.  
- **Settings**:  
  - Diary Folder: `Projects/Diary`  
  - Daily Created Section Title: `## Created Today`  
  - Daily Edited Section Title: `## Edited Today`  
  - Diary File Format: `YYYY-MM-DD`  
  - Excluded Folders: (empty)  
  - Enable Debug: No  
  - Diary Template Path: `Templates/ProjectDiary.md`  
- **Template** (`Templates/ProjectDiary.md`):  
  - Note: This is a pure Markdown file. `{{date}}` is a placeholder manually written by the user, which the plugin replaces with the current date (e.g., `2025-03-03`).  
{{date}} Project Diary
Daily Goals
 Finish Task A
Created Today
Edited Today

- **Actions**:  
  - 09:30: Create `Meeting Notes.md`.  
  - 10:15: Edit `Meeting Notes.md`.  
  - 14:00: Edit `Task List.md`.  
- **Result** (`Projects/Diary/2025-03-03.md`):  
2025-03-03 Project Diary
Daily Goals
 Finish Task A
Created Today
[[Meeting Notes]] (09:30 created)
Edited Today
[[Meeting Notes]] (09:30 created) | (10:15 edited)
[[Task List]] (14:00 edited)

- **Use Case**: Review daily project note activities alongside goals.

### Example 2: Learning Note Management
- **Scenario**: You use Obsidian for study notes and want to log daily learning progress.  
- **Settings**:  
  - Diary Folder: `Diary`  
  - Daily Created Section Title: `## New Notes`  
  - Daily Edited Section Title: `## Updated Notes`  
  - Diary File Format: `YYYY/MM/DD`  
  - Excluded Folders: `Templates/`  
  - Enable Debug: Yes  
  - Diary Template Path: (empty)  
- **Actions**:  
  - 13:45: Create `Python Basics.md`.  
  - 15:20: Edit `Python Basics.md`.  
- **Result** (`Diary/2025/03/03.md`):  
2025-03-03 Diary
New Notes
[[Python Basics]] (13:45 created)
Updated Notes
[[Python Basics]] (13:45 created) | (15:20 edited)

- **Use Case**: Track daily learning progress with a nested folder structure.

### Example 3: Selective Logging with Exclusions
- **Scenario**: You want to log notes but exclude private ones.  
- **Settings**:  
  - Diary Folder: `DailyLogs`  
  - Daily Created Section Title: `## Created Files`  
  - Daily Edited Section Title: `## Edited Files`  
  - Diary File Format: `YYYY-MM-DD`  
  - Excluded Folders: `Private/, Secrets/`  
  - Enable Debug: No  
  - Diary Template Path: `Templates/SimpleDiary.md`  
- **Template** (`Templates/SimpleDiary.md`):  
  - Note: `{{date}}` is a placeholder manually written by the user, replaced by the plugin with the current date.  
{{date}} Diary
Created Files
Edited Files

- **Actions**:  
  - 10:00: Create `Work Plan.md`.  
  - 10:05: Create `Private/Personal.md`.  
  - 11:00: Edit `Work Plan.md`.  
- **Result** (`DailyLogs/2025-03-03.md`):  
2025-03-03 Diary
Created Files
[[Work Plan]] (10:00 created)
Edited Files
[[Work Plan]] (10:00 created) | (11:00 edited)

- **Use Case**: Keep private notes out of the diary log.

---

## How to Use

1. **Install the Plugin**:  
   - **From Obsidian Community Plugins**:  
     1. Open Obsidian.  
     2. Go to **Settings > Community Plugins**.  
     3. Click **Browse**, search for "Daily File Logger", and install.  
     4. Enable the plugin.  
   - **Manual Installation**:  
     1. Download `main.js` and `manifest.json` from [GitHub Releases](https://github.com/<your-username>/daily-file-logger/releases).  
     2. Copy them to `<your vault>/.obsidian/plugins/daily-file-logger/`.  
     3. Enable in **Settings > Community Plugins**.  

2. **Configure Settings**:  
   - Go to **Settings > Community Plugins > Daily File Logger**.  
   - Adjust the settings as needed (see below).  

3. **Start Using**:  
   - Create or edit Markdown files; the plugin will log them automatically.  
   - Check the diary file (e.g., `Diary/2025-03-03.md`) for records.

---

## Settings Parameters

Here’s a detailed explanation of each setting:

- **Diary Folder**:  
  - **Description**: Specifies where diary files are stored.  
  - **Default**: `Diary`  
  - **Example**: `Projects/Diary` (nested folder), `DailyLogs`  
- **Daily Created Section Title**:  
  - **Description**: The heading for the section listing newly created files.  
  - **Default**: `## 当日创建文件` (## Created Today)  
  - **Example**: `## New Notes`, `## Created Files`  
- **Daily Edited Section Title**:  
  - **Description**: The heading for the section listing edited files.  
  - **Default**: `## 当日编辑文件` (## Edited Today)  
  - **Example**: `## Updated Notes`, `## Edited Files`  
- **Diary File Format**:  
  - **Description**: Defines the diary file name/path format using `moment.js`.  
  - **Default**: `YYYY-MM-DD` (e.g., `2025-03-03.md`)  
  - **Example**: `YYYY/MM/DD` (e.g., `2025/03/03.md`), `YYYY-MM` (e.g., `2025-03.md`)  
- **Excluded Folders**:  
  - **Description**: Folders to exclude from logging (one per line).  
  - **Default**: (empty)  
  - **Example**: `Private/, Templates/` (excludes `Private/` and `Templates/`)  
- **Enable Debug**:  
  - **Description**: If enabled, detailed logs are output to the developer console.  
  - **Default**: `false`  
  - **Example**: `true` (for troubleshooting)  
- **Diary Template Path**:  
  - **Description**: Path to a template file used when creating a new diary.  
  - **Default**: (empty)  
  - **Example**: `Templates/DiaryTemplate.md`

---

## License

This project is licensed under the [MIT License](LICENSE).

---

*Questions or suggestions? Contact me via [Issues](https://github.com/<your-username>/daily-file-logger/issues)!*
