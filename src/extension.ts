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
		let languageId: string | undefined = editor.document.languageId;
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
				languageId = undefined;
				break;
		}
		
		const questions = await search(query, languageId);
		const answers = await getAnswers(questions[0].question_id);
		const snippets = getSnippets(answers[0].body_markdown);

		if (snippets.length > 0) {
			editor.insertSnippet(new vscode.SnippetString(snippets[0]));
		}

		vscode.window.showInformationMessage('Pasted snippet from question: ' + questions[0].title);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
