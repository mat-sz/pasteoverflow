import * as vscode from 'vscode';

import { search, getAnswers, getSnippets, findBest } from './StackExchange';

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
		let tags: (string | undefined)[] = [];
		let languageId: string | undefined = editor.document.languageId;

		switch (languageId) {
			case 'csharp':
				tags.push('c#');
				break;
			case 'cpp':
				tags.push('c++');
				break;
			case 'javascriptreact':
				tags.push('reactjs');
				tags.push('javascript');
				break;
			case 'typescriptreact':
				tags.push('reactjs');
				tags.push('typescript');
				tags.push('javascript');
				break;
			case 'typescript':
				tags.push('typescript');
				tags.push('javascript');
				break;
			case 'dockerfile':
				tags.push('docker');
				break;
			case 'plaintext':
				// Disable language detection.
				break;
			default:
				tags.push(languageId);
		}

		tags.push(undefined);

		const result = await findBest(query, tags, true);
		if (result && result.snippets) {
			const { question, snippets } = result;
			editor.insertSnippet(new vscode.SnippetString(snippets[0]));
			vscode.window.showInformationMessage('Pasted snippet from question: ' + question.title);
		} else {
			vscode.window.showErrorMessage('Searched far and wide but no results were found.');
		}

	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
