# Obsidian Interviewer

A comprehensive Obsidian plugin designed to streamline the technical interview process. Create structured interview notes, manage question banks by topic, and generate professional interview reports.

## Features

### 📝 Interview Note Creation
- **Template-based interviews**: Use customizable templates to create structured interview notes
- **Automatic question insertion**: Questions are automatically pulled from your question bank based on tags
- **Candidate information tracking**: Standardized fields for candidate details and interview metadata

### 🗂️ Question Bank Management
- **Topic-based organization**: Organize questions by technology/topic (Git, Linux, JavaScript, etc.)
- **Tagged question system**: Use `#tech_question` tags to automatically include questions in interviews
- **Question format**: Simple markdown format with questions and expected answers

### ✏️ Interactive Interview Tools
- **Real-time commenting**: Add candidate answers and comments directly during the interview
- **Template comments**: Quick-access predefined comments for common responses
- **Section management**: Collapse completed sections to focus on remaining questions

### 📊 Interview Assessment
- **Overall assessment section**: Structured evaluation criteria
- **Answer tracking**: Monitor which questions were answered and how
- **Professional reporting**: Generate clean, formatted interview reports

## Installation

### Manual Installation
1. Download the latest release from the [releases page](https://github.com/yutimer/obsidian-interviewer/releases)
2. Extract the files to your vault's `.obsidian/plugins/obsidian-interviewer/` folder
3. Enable the plugin in Obsidian settings

### From Obsidian Community (Coming Soon)
The plugin will be available in the Obsidian Community Plugins directory.

## Quick Start

### 1. Set Up Your Question Bank


### 2. Create an Interview
TODO

### 3. Conduct the Interview
- Use the ✏️ button next to each question to add candidate answers
- Use the ✓ button to collapse completed sections
- Add comments and observations in real-time

## Templates

The plugin includes a default interview template with:
- Candidate information section
- Technical questions section (auto-populated)
- Overall assessment section

You can customize the template path in plugin settings.

## Settings

- **Template Path**: Specify the path to your interview template (default: `templates/interview.md`)

## Development

### Prerequisites
- Node.js 16 or higher
- Obsidian 0.15.0 or higher

### Setup
1. Clone the repository
2. Run `npm install`
3. Run `npm run dev` for development mode
4. The plugin will be compiled to `main.js`

### Building
- `npm run build` - Build the plugin for production
- `npm run dev` - Build in watch mode for development

Для отладки
cp main.js manifest.json styles.css /mnt/c/my\ docs/obsidian-interviewer/.obsidian/plugins/obsidian-interviewer/
## Roadmap

### Upcoming Features
- [ ] **Streamline template system** - Enhanced template customization
- [ ] **Question difficulty levels** - Sort questions by junior/mid/senior levels
- [ ] **Community plugin publication** - Submit to Obsidian Community Plugins

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for the Obsidian community
- Inspired by the need for better technical interview workflows
- Thanks to all contributors and users

---

**Happy interviewing! 🚀**
