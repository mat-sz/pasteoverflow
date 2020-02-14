import * as vscode from 'vscode';
import fetch from 'node-fetch';
import { AllHtmlEntities } from 'html-entities';

import { SEAnswersResponse, SEQuestionResponse } from './StackExchange';

const entities = new AllHtmlEntities();

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('pasteoverflow.findAndPaste', async () => {
		if (!vscode.window.activeTextEditor) {
			vscode.window.showErrorMessage('You have to be in an active editor window to use this command.');
			return;
		}

		const editor = vscode.window.activeTextEditor;

		// Ask for search text.
		const query = await vscode.window.showInputBox({
			placeHolder: 'Search query',
		});

		let url = 'https://api.stackexchange.com/2.2/search/advanced?order=desc&sort=relevance&accepted=True&answers=1&site=stackoverflow';
		url += '&q=' + query;

		// Get current language.
		let languageId: string | null = editor.document.languageId;
		switch (languageId) {
			case 'csharp':
				languageId = 'c#';
				break;
			case 'cpp':
				languageId = 'c++';
				break;
			case 'javascriptreact':
				languageId = 'reactjs';
				break;
			case 'dockerfile':
				languageId = 'docker';
				break;
			case 'plaintext':
				// Disable language detection.
				languageId = null;
				break;
		}

		if (languageId) {
			url += '&tagged=' + languageId;
		}
		
		// Get list of questions matching our query.
		let res = await fetch(url);
		const questions = await res.json() as SEQuestionResponse;

		// TODO: if none, try without tags, then return error.

		// Get answers.
		url = 'https://api.stackexchange.com/2.2/questions/' + questions.items[0].question_id + '/answers?order=desc&sort=activity&site=stackoverflow&filter=!9Z(-wzftf';
		
		res = await fetch(url);
		const answers = await res.json() as SEAnswersResponse;
		
		// Find the longest code snippet.
		const body = answers.items[0].body_markdown;

		let snippets = [];

		let snippet = '';
		let snippetMode = 'off';
		
		for (let line of body.split('\n')) {
			// ``` syntax:
			if (line.includes('```') && snippetMode === 'tick') {
				snippetMode = 'off';
			} else if (line.startsWith('```') && snippetMode === 'off') {
				snippetMode = 'tick';
			}

			// 4 spaces syntax:
			if (line.startsWith('    ')) {
				snippetMode = 'spaces';
			} else if (snippetMode === 'spaces') {
				snippetMode = 'off';
			}

			if (snippetMode === 'off') {
				if (snippet !== '') {
					snippets.push(entities.decode(snippet).replace(/\$/g, '\\$'));
					snippet = '';
				}
			} else {
				snippet += line.replace('```', '').replace('    ', '') + '\n';
			}
		}

		if (snippets.length > 0) {
			editor.insertSnippet(new vscode.SnippetString(snippets[0]));
		}

		vscode.window.showInformationMessage('Pasted snippet from question: ' + questions.items[0].title);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
