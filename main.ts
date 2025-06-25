import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';

// Remember to rename these classes and interfaces!

interface InterviewerSettings {
	templatePath: string;
}

const DEFAULT_SETTINGS: InterviewerSettings = {
	templatePath: 'templates/interview.md'
}

export default class InterviewerPlugin extends Plugin {
	settings: InterviewerSettings;

	async onload() {
		await this.loadSettings();

		// Register view extension to add buttons
		this.registerMarkdownPostProcessor((element, context) => {
			const questions = element.querySelectorAll('.callout[data-callout="question"]');
			const sections = element.querySelectorAll('h2');
			
			// Add buttons to sections
			sections.forEach((section) => {
				const buttonContainer = section.createEl('div', {
					cls: 'section-buttons'
				});

				const collapseBtn = buttonContainer.createEl('button', {
					cls: 'collapse-section',
					text: '✓'
				});

				collapseBtn.addEventListener('click', async (event) => {
					console.log('Button clicked');
					event.stopPropagation();
					
					// Get current file content
					const file = this.app.workspace.getActiveFile();
					if (!file) {
						console.log('No active file found');
						return;
					}
					console.log('Processing file:', file.path);

					const content = await this.app.vault.read(file);
					const lines = content.split('\n');
					console.log('Total lines in file:', lines.length);
					
					// Find the section - remove the button text from the title
					const sectionTitle = section.textContent?.replace('✓', '').trim();
					if (!sectionTitle) {
						console.log('No section title found');
						return;
					}
					console.log('Processing section:', sectionTitle);

					let inSection = false;
					let newContent = [];
					let currentQuestion = '';
					let hasAnswer = false;
					let questionLines = [];
					let inQuestionBlock = false;

					for (let i = 0; i < lines.length; i++) {
						const line = lines[i];
						const trimmedLine = line.trim();
						
						// Check if we're entering the section
						if (trimmedLine === `## ${sectionTitle}`) {
							console.log('Found section start at line:', i);
							inSection = true;
							newContent.push(line);
							continue;
						}

						// Check if we're leaving the section
						if (inSection && trimmedLine.startsWith('## ')) {
							console.log('Found section end at line:', i);
							inSection = false;
							// Process any remaining question
							if (currentQuestion && hasAnswer) {
								newContent.push(currentQuestion);
							}
							newContent.push(line);
							continue;
						}

						if (!inSection) {
							newContent.push(line);
							continue;
						}

						// Process questions in the section
						if (trimmedLine.includes('> [!question]-')) {
							// Process previous question if exists
							if (currentQuestion && hasAnswer) {
								console.log('Adding previous question:', currentQuestion);
								// Add question without callout syntax
								newContent.push(currentQuestion);
							}
							// Start new question
							const questionParts = trimmedLine.split('> [!question]-')[1].trim().split(' - ');
							currentQuestion = questionParts[0].trim();
							// Check if the question has a comment (indicated by -)
							hasAnswer = questionParts.length > 1 && questionParts[1].trim() !== '';
							if (hasAnswer) {
								currentQuestion += ' - ' + questionParts[1].trim();
							}
							questionLines = [line];
							inQuestionBlock = true;
						} else if (inQuestionBlock && trimmedLine.startsWith('>') && !trimmedLine.includes('[!question]')) {
							// This is an answer line - we don't need to process it anymore
							questionLines.push(line);
						} else if (trimmedLine === '' && inQuestionBlock) {
							// End of question block
							if (hasAnswer) {
								console.log('Adding commented question:', currentQuestion);
								// Add question without callout syntax
								newContent.push(currentQuestion);
							}
							currentQuestion = '';
							hasAnswer = false;
							questionLines = [];
							inQuestionBlock = false;
						} else if (inQuestionBlock) {
							questionLines.push(line);
						} else if (!trimmedLine.startsWith('> [!question]-')) {
							// Only add non-question lines
							newContent.push(line);
						}
					}

					// Handle the last question if exists
					if (currentQuestion && hasAnswer) {
						console.log('Adding final question:', currentQuestion);
						newContent.push(currentQuestion);
					}

					console.log('New content length:', newContent.length);
					console.log('New content preview:', newContent.slice(0, 10).join('\n'));

					// Update the file
					try {
						const newContentStr = newContent.join('\n');
						console.log('New content to write:', newContentStr);
						await this.app.vault.modify(file, newContentStr);
						console.log('File updated successfully');
					} catch (error) {
						console.error('Error updating file:', error);
					}
					
					// Refresh the view
					const view = this.app.workspace.getActiveViewOfType(MarkdownView);
					if (view) {
						console.log('Refreshing view');
						view.editor.setValue(newContent.join('\n'));
					} else {
						console.log('No active MarkdownView found');
					}
				});
			});
			
			questions.forEach((question) => {
				const titleEl = question.querySelector('.callout-title');
				if (!titleEl) return;

				// Check if question has a comment and add appropriate class
				const titleText = titleEl.textContent || '';
				if (titleText.includes(' - ')) {
					question.addClass('has-comment');
				} else {
					question.addClass('no-comment');
				}

				// Create button container
				const buttonContainer = titleEl.createEl('div', {
					cls: 'question-buttons'
				});

				// Add button for candidate's answer
				const addAnswerBtn = buttonContainer.createEl('button', {
					cls: 'add-candidate-answer',
					text: '✏️'
				});

				addAnswerBtn.addEventListener('click', async (event) => {
					event.stopPropagation(); // Prevent callout from collapsing
					
					// Get current file content
					const file = this.app.workspace.getActiveFile();
					if (!file) return;

					const content = await this.app.vault.read(file);
					const lines = content.split('\n');
					
					// Get the question text from the title element and create search patterns
					const displayedQuestion = titleEl.textContent?.split('?')[0].trim() || '';
					console.log('Question as displayed:', displayedQuestion);
					
					// Find the matching line and any existing answer
					let lineIndex = -1;
					let existingAnswer = '';

					for (let i = 0; i < lines.length; i++) {
						const line = lines[i];
						console.log('Checking line:', line);
						
						// Remove markdown formatting for comparison
						const cleanLine = line.replace(/`([^`]+)`/g, '$1')  // Remove backticks but keep content
											.replace(/\*\*([^\*]+)\*\*/g, '$1')  // Remove bold
											.replace(/\*([^\*]+)\*/g, '$1')  // Remove italic
											.replace(/\_([^\_]+)\_/g, '$1'); // Remove underscore emphasis
						
						// Also clean the displayed question for comparison
						const cleanQuestion = displayedQuestion.replace(/`([^`]+)`/g, '$1')
															 .replace(/\*\*([^\*]+)\*\*/g, '$1')
															 .replace(/\*([^\*]+)\*/g, '$1')
															 .replace(/\_([^\_]+)\_/g, '$1');
						
						console.log('Clean line:', cleanLine);
						console.log('Clean question:', cleanQuestion);
						
						if (cleanLine.includes(cleanQuestion)) {
							lineIndex = i;
							console.log('Found question at line:', i);
							
							// Check for existing answer
							const answerMatch = line.match(/\? - (.*?)$/);
							if (answerMatch) {
								existingAnswer = answerMatch[1];
								console.log('Found existing answer:', existingAnswer);
							}
							break;
						}
					}

					const modal = new CandidateAnswerModal(this.app, async (result) => {
						if (result) {
							console.log('New answer:', result);
							console.log('Line index:', lineIndex);
							
							if (lineIndex !== -1) {
								const currentContent = await this.app.vault.read(file);
								const currentLines = currentContent.split('\n');
								const currentLine = currentLines[lineIndex];
								
								// If there's already an answer, replace it
								if (currentLine.includes(' - ')) {
									currentLines[lineIndex] = currentLine.replace(/ - .*$/, ` - ${result}`);
								} else {
									// Add new answer
									currentLines[lineIndex] = `${currentLine.trim()} - ${result}`;
								}
								
								console.log('Updated line:', currentLines[lineIndex]);
								await this.app.vault.modify(file, currentLines.join('\n'));
								new Notice('Answer updated');
							} else {
								new Notice('Could not find the question line to update');
							}
						}
					}, existingAnswer);
					modal.open();
				});
			});
		});

		// Add ribbon icon
		this.addRibbonIcon('file-text', 'Create Interview Notes', async () => {
			await this.createInterviewNotes();
		});

		// Add command
		this.addCommand({
			id: 'create-interview-notes',
			name: 'Create Interview Notes',
			callback: async () => {
				await this.createInterviewNotes();
			}
		});

		// Add settings tab
		this.addSettingTab(new InterviewerSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createInterviewNotes() {
		try {
			// Get all files with #tech_question tag
			const files = this.app.vault.getMarkdownFiles();
			console.log('All markdown files:', files.map(f => f.path));
			
			const questionFiles = files.filter(file => {
				// Skip template file
				if (file.path === this.settings.templatePath) {
					return false;
				}
				
				// Check for tag in frontmatter
				const cache = this.app.metadataCache.getFileCache(file);
				const frontmatter = cache?.frontmatter;
				console.log('Checking file:', file.path, 'Frontmatter:', frontmatter);
				
				return frontmatter?.tags?.includes('tech_question');
			});

			console.log('Found question files:', questionFiles.map(f => f.path));

			if (questionFiles.length === 0) {
				new Notice('No files with tech_question tag found');
				return;
			}

			// Create new file
			const date = new Date().toISOString().split('T')[0];
			const newFileName = `Interviews/Interview ${date}.md`;
			
			// Get template content
			let content = '';
			const templateFile = this.app.vault.getAbstractFileByPath(this.settings.templatePath);
			console.log('Looking for template at:', this.settings.templatePath);
			console.log('Found template:', templateFile?.path);
			
			if (templateFile instanceof TFile) {
				content = await this.app.vault.read(templateFile);
				console.log('Template content:', content);
			}

			// Collect all questions
			let allQuestions = '';
			for (const file of questionFiles) {
				const fileContent = await this.app.vault.read(file);
				const title = file.basename;
				console.log('Processing file:', file.path);
				
				// Add section header
				allQuestions += `\n## ${title}\n`;
				
				// Add questions
				const lines = fileContent.split('\n');
				let inFrontmatter = false;
				let currentQuestion = '';
				let currentAnswer = '';
				let isAnswer = false;
				
				for (const line of lines) {
					// Skip frontmatter
					if (line.trim() === '---') {
						inFrontmatter = !inFrontmatter;
						continue;
					}
					if (inFrontmatter) {
						continue;
					}
					
					// Skip tags
					if (line.trim().startsWith('@')) {
						continue;
					}
					
					// If we're in an answer section, collect answer until we hit an empty line
					if (isAnswer) {
						if (!line.trim()) {
							isAnswer = false;
							// Add the question with interactive elements
							allQuestions += this.createInteractiveQuestion(currentQuestion, currentAnswer);
							currentQuestion = '';
							currentAnswer = '';
						} else {
							currentAnswer += line + '\n';
						}
						continue;
					}
					
					// If line starts with #, it's a question
					if (line.trim().startsWith('#')) {
						// If we have a previous question, add it
						if (currentQuestion) {
							allQuestions += this.createInteractiveQuestion(currentQuestion, currentAnswer);
							currentQuestion = '';
							currentAnswer = '';
						}
						// Remove the # and any extra spaces
						currentQuestion = line.trim().replace(/^#+\s*/, '');
					}
					// If we hit a question mark, start collecting answer
					else if (line.trim() === '?') {
						isAnswer = true;
					}
				}
				
				// Add the last question if exists
				if (currentQuestion) {
					allQuestions += this.createInteractiveQuestion(currentQuestion, currentAnswer);
				}
			}

			// Insert questions into template
			content = content.replace(
				'// Questions will be automatically inserted here from files tagged with #tech_question',
				allQuestions.trim()
			);

			console.log('Final content:', content);

			// Create new file
			const newFile = await this.app.vault.create(newFileName, content);
			new Notice(`Created new interview notes: ${newFileName}`);
			
			// Open the new file
			await this.app.workspace.getLeaf().openFile(newFile);
		} catch (error) {
			new Notice(`Error creating interview notes: ${error}`);
			console.error(error);
		}
	}

	private createInteractiveQuestion(question: string, answer: string): string {
		// Use Obsidian's callout syntax for questions
		return `
> [!question]- ${question}
> ${answer}
`;
	}

	// Helper function to escape special characters for regex
	private escapeRegExp(string: string): string {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}

class InterviewerSettingTab extends PluginSettingTab {
	plugin: InterviewerPlugin;

	constructor(app: App, plugin: InterviewerPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Interviewer Plugin Settings'});

		new Setting(containerEl)
			.setName('Template path')
			.setDesc('Path to the interview template file')
			.addText(text => text
				.setPlaceholder('Templates/Interview Template.md')
				.setValue(this.plugin.settings.templatePath)
				.onChange(async (value) => {
					this.plugin.settings.templatePath = value;
					await this.plugin.saveSettings();
				}));
	}
}

class CandidateAnswerModal extends Modal {
	private result: string;
	private onSubmit: (result: string) => void;
	private initialValue: string;

	constructor(app: App, onSubmit: (result: string) => void, initialValue: string = '') {
		super(app);
		this.onSubmit = onSubmit;
		this.initialValue = initialValue;
	}

	onOpen() {
		const {contentEl} = this;

		contentEl.createEl('h2', {text: 'Add Candidate Answer'});

		const inputEl = contentEl.createEl('textarea', {
			attr: {
				rows: '4',
				placeholder: 'Enter candidate\'s response or your notes about their answer...'
			},
			text: this.initialValue
		});
		inputEl.style.width = '100%';
		inputEl.style.marginBottom = '1em';

		// Set cursor at the end of the text
		inputEl.focus();
		inputEl.setSelectionRange(this.initialValue.length, this.initialValue.length);

		const buttonContainer = contentEl.createEl('div', {
			cls: 'button-container'
		});

		buttonContainer.createEl('button', {
			text: 'Submit',
			cls: 'mod-cta'
		}).addEventListener('click', () => {
			this.onSubmit(inputEl.value);
			this.close();
		});

		buttonContainer.createEl('button', {
			text: 'Cancel'
		}).addEventListener('click', () => {
			this.close();
		});
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

