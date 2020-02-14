import * as vscode from 'vscode';

import { search, getAnswers, getSnippets } from './StackExchange';

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

		if (!query) {
			return;
		}

		// Get current language.
		let tryTags: (string | undefined)[] = [];
		let languageId: string | undefined = editor.document.languageId;

		switch (languageId) {
			case 'csharp':
				tryTags.push('c#');
				break;
			case 'cpp':
				tryTags.push('c++');
				break;
			case 'javascriptreact':
				tryTags.push('reactjs');
				tryTags.push('javascript');
				break;
			case 'typescriptreact':
				tryTags.push('reactjs');
				tryTags.push('typescript');
				tryTags.push('javascript');
				break;
			case 'typescript':
				tryTags.push('typescript');
				tryTags.push('javascript');
				break;
			case 'dockerfile':
				tryTags.push('docker');
				break;
			case 'plaintext':
				// Disable language detection.
				break;
			default:
				tryTags.push(languageId);
		}

		tryTags.push(undefined);

		for (let tag of tryTags) {
			const questions = await search(query, tag);

			for (let question of questions) {
				const answers = await getAnswers(question.question_id);
				const snippets = getSnippets(answers[0].body_markdown);
	
				if (snippets.length > 0) {
					editor.insertSnippet(new vscode.SnippetString(snippets[0]));
					vscode.window.showInformationMessage('Pasted snippet from question: ' + question.title);

					return;
				}
			}
		}

	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
