import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from 'obsidian';

// Remember to rename these classes and interfaces!

interface InterviewerSettings {
	templatePath: string;
	interviewFolder: string;
	interviewTag: string;
}

const DEFAULT_SETTINGS: InterviewerSettings = {
	templatePath: 'templates/interview.md',
	interviewFolder: '/', // Default in vault root
	interviewTag: '#interview'
}

export default class InterviewerPlugin extends Plugin {
	settings: InterviewerSettings;

	async onload() {
		await this.loadSettings();

		// Register view extension to add buttons
		this.registerMarkdownPostProcessor(async (element, context) => {
			// Check if this file has the interview tag
			const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
			if (!(file instanceof TFile)) return;

			const content = await this.app.vault.read(file);
			const tag = this.settings.interviewTag;

			// Check if file contains the interview tag (in frontmatter or content)
			if (!content.includes(tag)) return;

			// Look for questions in both formats: h1 headers and callout blocks
                        const h1Questions = element.querySelectorAll('h1');
                        const callouts = element.querySelectorAll('.callout');
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
					let currentDifficulty = '';
					let currentAnswer = '';
					let currentCandidateAnswer = '';
					let hasAnswer = false;
					let questionLines = [];
					let inQuestionBlock = false;
					let inCandidateBlock = false;
					let sectionQuestions: Array<{question: string, answer: string, candidateAnswer: string, difficulty: string}> = [];

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

											// Process questions in the section using new format
					const H1 = /^#\s+(.+?)\s+#(easy|medium|hard)\s*$/i;
					const ANSWER = /^\?\s*$/;
					const CANDIDATE_START = /^>\s*@candidate\s*$/;
					const CANDIDATE_CONTENT = /^>\s*(.+)$/;

					const h1Match = H1.exec(trimmedLine);
					if (h1Match) {
						// Process previous question if exists
						if (currentQuestion && hasAnswer) {
							console.log('Adding previous question to array:', currentQuestion);
							sectionQuestions.push({
								question: currentQuestion,
								answer: currentAnswer.trim(),
								candidateAnswer: currentCandidateAnswer.trim(),
								difficulty: currentDifficulty
							});
						}
						// Start new question
						currentQuestion = h1Match[1].trim();
						currentDifficulty = h1Match[2].toLowerCase();
						questionLines = [line];
						inQuestionBlock = true;
						hasAnswer = false;
						currentAnswer = '';
						currentCandidateAnswer = '';
						inCandidateBlock = false;
					} else if (ANSWER.test(trimmedLine)) {
						// This is an answer marker
						inQuestionBlock = true;
						hasAnswer = false; // Will be set to true when we start collecting answer
					} else if (CANDIDATE_START.test(trimmedLine)) {
						// Start of candidate block
						inCandidateBlock = true;
					} else if (inCandidateBlock && CANDIDATE_CONTENT.test(trimmedLine)) {
						// Collect candidate answer content
						const candidateMatch = CANDIDATE_CONTENT.exec(trimmedLine);
						if (candidateMatch) {
							currentCandidateAnswer += candidateMatch[1] + '\n';
						}
					} else if (inCandidateBlock && trimmedLine === '') {
						// End of candidate block (empty line without >)
						inCandidateBlock = false;
					} else if (inQuestionBlock && hasAnswer === false && trimmedLine !== '' && !inCandidateBlock) {
						// Start collecting answer
						hasAnswer = true;
						currentAnswer = line;
					} else if (inQuestionBlock && hasAnswer && trimmedLine !== '' && !inCandidateBlock) {
						// Continue collecting answer
						currentAnswer += '\n' + line;
					} else if (inQuestionBlock && hasAnswer && trimmedLine === '' && !inCandidateBlock) {
						// End of answer section
						if (currentQuestion && hasAnswer) {
							console.log('Adding answered question to array:', currentQuestion);
							sectionQuestions.push({
								question: currentQuestion,
								answer: currentAnswer.trim(),
								candidateAnswer: currentCandidateAnswer.trim(),
								difficulty: currentDifficulty
							});
						}
						currentQuestion = '';
						hasAnswer = false;
						currentAnswer = '';
						currentCandidateAnswer = '';
						inQuestionBlock = false;
						inCandidateBlock = false;
					} else if (!inQuestionBlock && !inCandidateBlock) {
						// Only add non-question lines
						newContent.push(line);
					}
					}

					// Handle the last question if exists
					if (currentQuestion && hasAnswer) {
						console.log('Adding final question to array:', currentQuestion);
						sectionQuestions.push({
							question: currentQuestion,
							answer: currentAnswer.trim(),
							candidateAnswer: currentCandidateAnswer.trim(),
							difficulty: currentDifficulty
						});
					}

					// Sort questions by difficulty: easy -> medium -> hard
					const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
					sectionQuestions.sort((a, b) => {
						return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
					});

					// Add sorted questions to new content
					for (const q of sectionQuestions) {
						newContent.push(`# ${q.question} #${q.difficulty}`);
						newContent.push('?');
						newContent.push(q.answer);
						// Add candidate answer if it exists
						if (q.candidateAnswer && q.candidateAnswer.trim() !== '') {
							newContent.push('');
							newContent.push('> @candidate');
							newContent.push(`> ${q.candidateAnswer}`);
						}
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
			
			// Process h1 questions
			h1Questions.forEach((question) => {
				// Check if this h1 is a question (has difficulty tag)
				const titleText = question.textContent || '';
				if (!titleText.includes('#')) return; // Skip if no difficulty tag

				// Check if question has a comment and add appropriate class
				if (titleText.includes(' - ')) {
					question.addClass('has-comment');
				} else {
					question.addClass('no-comment');
				}

				// Create button container
				const buttonContainer = question.createEl('div', {
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
					
					// Get the question text from the question element
					const displayedQuestion = question.textContent?.trim() || '';
					console.log('Question as displayed:', displayedQuestion);
					
					// Find the matching question in new format and any existing answer
					let questionLineIndex = -1;
					let answerLineIndex = -1;
					let existingAnswer = '';
					const H1 = /^#\s+(.+?)\s+#(easy|medium|hard)\s*$/i;
					const ANSWER = /^\?\s*$/;

					for (let i = 0; i < lines.length; i++) {
						const line = lines[i];

						// Look for the question header line
						const h1Match = H1.exec(line);
						if (h1Match && h1Match[1].trim() === displayedQuestion.replace(/^[🟢🟡🔴❓]\s*/, '')) {
							questionLineIndex = i;
							console.log('Found question at line:', i);

							// Look for answer marker and content
							if (i + 1 < lines.length && ANSWER.test(lines[i + 1])) {
								// Start collecting answer from the next line
								let answerStart = i + 2;
								let answerLines = [];

								for (let j = answerStart; j < lines.length; j++) {
									const answerLine = lines[j];
									// Stop if we hit another question or section
									if (H1.test(answerLine) || answerLine.trim().startsWith('## ')) {
										break;
									}
									if (answerLine.trim() !== '') {
										answerLines.push(answerLine);
									}
								}

								if (answerLines.length > 0) {
									answerLineIndex = answerStart;
									existingAnswer = answerLines.join('\n');
									console.log('Found existing answer:', existingAnswer);
								}
							}
							break;
						}
					}

					const modal = new CandidateAnswerModal(this.app, async (result) => {
						if (result) {
							console.log('New answer:', result);
							console.log('Question line index:', questionLineIndex);
							
							if (questionLineIndex !== -1) {
								const currentContent = await this.app.vault.read(file);
								const currentLines = currentContent.split('\n');
								
								// If there's already an answer, replace it
								if (answerLineIndex !== -1) {
									// Remove existing answer lines
									let linesToRemove = 0;
									for (let j = answerLineIndex; j < currentLines.length; j++) {
										const line = currentLines[j];
										if (H1.test(line) || line.trim().startsWith('## ')) {
											break;
										}
										linesToRemove++;
									}
                                                                        const formatted = result.split('\n').map(l => `> ${l}`);
                                                                        currentLines.splice(answerLineIndex, linesToRemove, '> @candidate', ...formatted, '');
                                                                } else {
                                                                        // Add new answer after the question and ? marker
                                                                        const formatted = result.split('\n').map(l => `> ${l}`);
                                                                        currentLines.splice(questionLineIndex + 2, 0, '> @candidate', ...formatted, '');
                                                                }
								
								console.log('Updated lines:', currentLines.slice(questionLineIndex, questionLineIndex + 3));
								await this.app.vault.modify(file, currentLines.join('\n'));
								new Notice('Answer updated');
							} else {
								new Notice('Could not find the question to update');
							}
						}
					}, existingAnswer);
					modal.open();
				});
			});

			// Process callout questions (new format)
                        callouts.forEach((callout) => {
				// Check if this is a question callout
				const calloutTitle = callout.querySelector('.callout-title');
				if (!calloutTitle) return;

				const titleText = calloutTitle.textContent || '';
				// Check if it's a question callout with difficulty emoji
				if (!titleText.includes('🟢') && !titleText.includes('🟡') && !titleText.includes('🔴') && !titleText.includes('❓')) {
					return;
				}

				// Create button container
				const buttonContainer = calloutTitle.createEl('div', {
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

					// Get the question text from the callout title (remove emoji and button text)
					const displayedQuestion = titleText.replace(/^[🟢🟡🔴❓]\s*/, '').replace('✏️', '').trim();
					console.log('Question as displayed:', displayedQuestion);

					// Find the matching question in callout format and any existing answer
					let questionLineIndex = -1;
					let answerLineIndex = -1;
					let answerEndIndex = -1;
					let existingAnswer = '';
					const CALLOUT = /^>\s*\[!question\]-?\s*[🟢🟡🔴❓]\s*(.+)$/i;
                                        const CANDIDATE_START = /^>\s*@candidate\s*$/i;
                                        const CALLOUT_LINE = /^>\s*(.*)$/;
					const NOT_CALLOUT = /^[^>]/;

					for (let i = 0; i < lines.length; i++) {
						const line = lines[i];

						// Look for the question callout line
						const calloutMatch = CALLOUT.exec(line);
						if (calloutMatch && calloutMatch[1].trim() === displayedQuestion) {
							questionLineIndex = i;
							console.log('Found question callout at line:', i);

                                                        // Look for candidate answer block
                                                        let answerLines = [];
                                                        for (let j = i + 1; j < lines.length; j++) {
                                                                const answerLine = lines[j];

                                                                // Stop if we hit another question or section
                                                                if (CALLOUT.exec(answerLine) || answerLine.trim().startsWith('## ') || NOT_CALLOUT.test(answerLine)) {
                                                                        break;
                                                                }

                                                                if (CANDIDATE_START.test(answerLine)) {
                                                                        answerLineIndex = j;
                                                                        answerEndIndex = j; // Start with just the @candidate line

                                                                        // Collect all lines until we leave the callout block
                                                                        for (let k = j + 1; k < lines.length; k++) {
                                                                                const candidateLine = lines[k];

                                                                                // Check if we hit another question or section
                                                                                if (CALLOUT.exec(candidateLine) || candidateLine.trim().startsWith('## ')) {
                                                                                        // answerEndIndex is already set to last valid line
                                                                                        break;
                                                                                }

                                                                                // Check if it's a non-callout line (not starting with >)
                                                                                if (NOT_CALLOUT.test(candidateLine)) {
                                                                                        // If it's empty, it might be between callout blocks - include it
                                                                                        if (candidateLine.trim() === '') {
                                                                                                answerEndIndex = k;
                                                                                        }
                                                                                        // Non-empty non-callout line = definitely end of block
                                                                                        break;
                                                                                }

                                                                                // It's a callout line (starts with >)
                                                                                answerEndIndex = k;
                                                                                const contentMatch = CALLOUT_LINE.exec(candidateLine);
                                                                                if (contentMatch) {
                                                                                        answerLines.push(contentMatch[1]);
                                                                                }
                                                                        }
                                                                        break;
                                                                }
                                                        }

                                                        if (answerLines.length > 0) {
                                                                existingAnswer = answerLines.join('\n');
                                                                console.log('Found existing answer:', existingAnswer);
                                                        }
                                                        break;
                                                }
                                        }

					const modal = new CandidateAnswerModal(this.app, async (result) => {
						if (result !== null && result !== undefined) {
							console.log('New answer:', result);
							console.log('Question line index:', questionLineIndex);

							if (questionLineIndex !== -1) {
								const currentContent = await this.app.vault.read(file);
								const currentLines = currentContent.split('\n');

                                                                // If there's already an answer, replace it
                                                                if (answerLineIndex !== -1) {
                                                                        if (result.trim() === '') {
                                                                                // Remove the entire candidate block if answer is empty
                                                                                // Find start of the candidate block (including separator line before @candidate)
                                                                                let removeStart = answerLineIndex;

                                                                                // Go back to find the empty ">" separator line
                                                                                while (removeStart > 0 && currentLines[removeStart - 1].trim() === '>') {
                                                                                        removeStart--;
                                                                                }

                                                                                // Find end of the candidate block
                                                                                let removeEnd = answerEndIndex;

                                                                                // Check if there's a trailing empty line after the answer
                                                                                if (removeEnd + 1 < currentLines.length && currentLines[removeEnd + 1].trim() === '') {
                                                                                        removeEnd++;
                                                                                }

                                                                                // Remove from separator line through answer and trailing empty line
                                                                                const removeCount = removeEnd - removeStart + 1;
                                                                                currentLines.splice(removeStart, removeCount);
                                                                        } else {
                                                                                // Calculate lines to remove
                                                                                let linesToRemove = answerEndIndex - answerLineIndex + 1;
                                                                                if (answerEndIndex + 1 < currentLines.length && currentLines[answerEndIndex + 1].trim() === '') {
                                                                                        linesToRemove++;
                                                                                }

                                                                                const formatted = result.split('\n').map(l => `> ${l}`);
                                                                                // Replace old answer with new one and add empty line after to close callout
                                                                                currentLines.splice(answerLineIndex, linesToRemove, '> @candidate', ...formatted, '');
                                                                        }
                                                                } else {
                                                                        // Add new answer after the canonical answer block
                                                                        if (result.trim() !== '') {
                                                                                let insertIndex = questionLineIndex;
                                                                                for (let j = questionLineIndex + 1; j < currentLines.length; j++) {
                                                                                        const line = currentLines[j];
                                                                                        if (CALLOUT.test(line) || line.trim().startsWith('## ') || NOT_CALLOUT.test(line)) {
                                                                                                insertIndex = j - 1;
                                                                                                break;
                                                                                        }
                                                                                        insertIndex = j;
                                                                                }
                                                                                const formatted = result.split('\n').map(l => `> ${l}`);
                                                                                // Add candidate answer with separator line before and empty line after to close callout
                                                                                currentLines.splice(insertIndex + 1, 0, '>', '> @candidate', ...formatted, '');
                                                                        }
                                                                }

								console.log('Updated lines:', currentLines.slice(questionLineIndex, Math.min(questionLineIndex + 10, currentLines.length)));
								await this.app.vault.modify(file, currentLines.join('\n'));
								new Notice('Answer updated');
							} else {
								new Notice('Could not find the question to update');
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
                        // Create new file name and ensure the target folder exists
                        const date = new Date().toISOString().split('T')[0];

                        const folderPath = this.settings.interviewFolder.replace(/\/+$/, '');
                        const folder = folderPath ? folderPath + '/' : '';
                        const newFileName = `${folder}Interview ${date}.md`;

                        if (folderPath && !this.app.vault.getAbstractFileByPath(folderPath)) {
                                await this.app.vault.createFolder(folderPath);
                        }
			
			// Get template content
			let content = '';
			const templateFile = this.app.vault.getAbstractFileByPath(this.settings.templatePath);
			console.log('Looking for template at:', this.settings.templatePath);
			console.log('Found template:', templateFile?.path);
			
			if (templateFile instanceof TFile) {
				content = await this.app.vault.read(templateFile);
				console.log('Template content:', content);
			}

			// Replace date placeholder
			content = content.replace('{{date}}', date);

			// Process Markdown links in the template and add questions after them
			const linkRegex = /\[\[([^\]]+)\]\]/g;
			let match;
			let processedContent = content;

			while ((match = linkRegex.exec(content)) !== null) {
				const linkText = match[1];
				const fullMatch = match[0];
				
				console.log('Found link:', fullMatch, 'Link text:', linkText);
				
				// Try to find the file by name
				const files = this.app.vault.getMarkdownFiles();
				const targetFile = files.find(file => {
					// Check if the filename matches (case-insensitive)
					return file.basename.toLowerCase() === linkText.toLowerCase();
				});
				
				if (targetFile) {
					console.log('Found target file:', targetFile.path);
					
					// Extract questions from the file
					const questionsContent = await this.extractQuestionsFromFile(targetFile);
					
					// Add questions after the link (not replace it)
					processedContent = processedContent.replace(fullMatch, fullMatch + '\n\n' + questionsContent);
				} else {
					console.log('Could not find file for link:', linkText);
				}
			}

			console.log('Final content:', processedContent);

			// Add interview tag at the end
			processedContent = processedContent + '\n\n' + this.settings.interviewTag;

			// Create new file
			const newFile = await this.app.vault.create(newFileName, processedContent);
			new Notice(`Created new interview notes: ${newFileName}`);
			
			// Open the new file
			await this.app.workspace.getLeaf().openFile(newFile);
		} catch (error) {
			new Notice(`Error creating interview notes: ${error}`);
			console.error(error);
		}
	}

	private async extractQuestionsFromFile(file: TFile): Promise<string> {
		const fileContent = await this.app.vault.read(file);
		const lines = fileContent.split('\n');
		let inFrontmatter = false;
		let currentQuestion = '';
		let currentDifficulty = '';
		let currentAnswer = '';
		let currentCandidateAnswer = '';
		let isAnswer = false;
		let inCandidateBlock = false;
		let questions: Array<{question: string, answer: string, candidateAnswer: string, difficulty: string}> = [];
		
		// Regex patterns for the new format
		const H1 = /^#\s+(.+?)\s+#(easy|medium|hard)\s*$/i;
		const ANSWER = /^\?\s*$/;
		const CANDIDATE_START = /^>\s*@candidate\s*$/;
		const CANDIDATE_CONTENT = /^>\s*(.+)$/;
		
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const trimmedLine = line.trim();
			
			// Skip frontmatter
			if (trimmedLine === '---') {
				inFrontmatter = !inFrontmatter;
				continue;
			}
			if (inFrontmatter) {
				continue;
			}
			
			// Check for new question header (# format)
			const h1Match = H1.exec(line);
			if (h1Match) {
				// If we have a previous question, add it to the array
				if (currentQuestion) {
					questions.push({
						question: currentQuestion,
						answer: currentAnswer.trim(),
						candidateAnswer: currentCandidateAnswer.trim(),
						difficulty: currentDifficulty
					});
					currentQuestion = '';
					currentAnswer = '';
					currentCandidateAnswer = '';
					currentDifficulty = '';
				}
				// Extract question and difficulty
				currentQuestion = h1Match[1].trim();
				currentDifficulty = h1Match[2].toLowerCase();
				isAnswer = false;
				inCandidateBlock = false;
				continue;
			}
			
			// Check for answer marker
			if (ANSWER.test(line)) {
				isAnswer = true;
				continue;
			}
			
			// Check for candidate block start
			if (CANDIDATE_START.test(line)) {
				inCandidateBlock = true;
				continue;
			}
			
			// Handle candidate block content
			if (inCandidateBlock) {
				const candidateMatch = CANDIDATE_CONTENT.exec(line);
				if (candidateMatch) {
					currentCandidateAnswer += candidateMatch[1] + '\n';
				} else if (trimmedLine === '') {
					// End of candidate block (empty line without >)
					inCandidateBlock = false;
				}
				continue;
			}
			
			// If we're in an answer section, collect answer until we hit another # header or candidate block
			if (isAnswer && !inCandidateBlock) {
				// Check if we hit another question header or candidate block
				if (H1.test(line) || CANDIDATE_START.test(line)) {
					// Add the previous question to the array and start new one
					questions.push({
						question: currentQuestion,
						answer: currentAnswer.trim(),
						candidateAnswer: currentCandidateAnswer.trim(),
						difficulty: currentDifficulty
					});

					// Parse the new header if it's a question
					if (H1.test(line)) {
						const newH1Match = H1.exec(line);
						if (newH1Match) {
							currentQuestion = newH1Match[1].trim();
							currentDifficulty = newH1Match[2].toLowerCase();
							currentAnswer = '';
							currentCandidateAnswer = '';
							isAnswer = false;
						}
					}
					// Handle candidate block start
					if (CANDIDATE_START.test(line)) {
						inCandidateBlock = true;
					}
				} else {
					// Continue collecting answer
					currentAnswer += line + '\n';
				}
				continue;
			}
		}
		
		// Add the last question if exists
		if (currentQuestion) {
			questions.push({
				question: currentQuestion,
				answer: currentAnswer.trim(),
				candidateAnswer: currentCandidateAnswer.trim(),
				difficulty: currentDifficulty
			});
		}
		
		// Sort questions by difficulty: easy -> medium -> hard
		const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
		questions.sort((a, b) => {
			return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
		});
		
                // Convert sorted questions back to string format
                let questionsContent = '';
                questions.forEach((q, idx) => {
                        questionsContent += this.createInteractiveQuestion(q.question, q.answer, q.candidateAnswer, q.difficulty, idx) + '\n\n';
                });

                return questionsContent.trim();
        }

        public slugify(text: string): string {
                return text
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-+|-+$/g, '');
        }

        private createInteractiveQuestion(question: string, answer: string, candidateAnswer: string, difficulty: string, index: number): string {
                // Map difficulty to emoji
                const difficultyEmoji = {
                        easy: '🟢',
                        medium: '🟡',
                        hard: '🔴'
                }[difficulty] || '❓';

                // Format canonical answer with > prefix for callout
                const canonicalLines = answer.split('\n').map(line => `> ${line}`).join('\n');

                // Build the question callout
                let result = `> [!question]- ${difficultyEmoji} ${question}\n${canonicalLines}`;

                // Add candidate answer if exists
                if (candidateAnswer && candidateAnswer.trim() !== '') {
                        const candidateLines = candidateAnswer.split('\n').map(line => `> ${line}`).join('\n');
                        result += `\n>\n> @candidate\n${candidateLines}`;
                }

                return result;
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

		new Setting(containerEl)
			.setName('Interview notes folder')
			.setDesc('Folder (relative to vault root) where new interview notes will be created.')
			.addText(text => text
				.setPlaceholder('/')
				.setValue(this.plugin.settings.interviewFolder)
				.onChange(async (value) => {
					this.plugin.settings.interviewFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Interview tag')
			.setDesc('Tag used to identify interview files (e.g., #interview). Interactive buttons will only appear in files with this tag.')
			.addText(text => text
				.setPlaceholder('#interview')
				.setValue(this.plugin.settings.interviewTag)
				.onChange(async (value) => {
					this.plugin.settings.interviewTag = value;
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
