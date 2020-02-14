import * as vscode from 'vscode';

import { findBest, tagsFromLanguageId } from './StackExchange';

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
		let languageId: string = editor.document.languageId;
		const result = await findBest(query, tagsFromLanguageId(languageId), true);

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
