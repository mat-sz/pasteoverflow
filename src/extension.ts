import * as vscode from 'vscode';

import { findBest, tagsFromLanguageId, findMany, SEQuestionItem } from './StackExchange';

async function editorQuery() {
	if (!vscode.window.activeTextEditor) {
		vscode.window.showErrorMessage('You have to be in an active editor window to use this command.');
		return;
	}

	// Ask for search text.
	return await vscode.window.showInputBox({
		placeHolder: 'Search query',
	});
}

function createSnippet(question: SEQuestionItem, code: string) {
	const config = vscode.workspace.getConfiguration('pasteoverflow');
	let snippet = '';

	// TODO: Wait for https://github.com/microsoft/vscode/issues/2871
	// Currently it's not possible to find the right comment beginning
	// sequence without hardcoding them all.
	if (config.get<boolean>('prependTitleComment') === true) {
		snippet += '// ' + question.title + '\n';
	}

	if (config.get<boolean>('prependLinkComment') === true) {
		snippet += '// ' + question.link + '\n';
	}

	snippet += code;

	return new vscode.SnippetString(snippet);
}

export function activate(context: vscode.ExtensionContext) {
	// PasteOverflow: Search and paste (I'm feeling lucky)
	const luckyDisposable = vscode.commands.registerCommand('pasteoverflow.findAndPasteLucky', async () => {
		const query = await editorQuery();
		const editor = vscode.window.activeTextEditor;

		if (!query || !editor) {
			return;
		}

		// Get current language.
		let languageId: string = editor.document.languageId;
		const result = await findBest(query, tagsFromLanguageId(languageId), true);

		if (result) {
			const { question, snippets } = result;
			editor.insertSnippet(createSnippet(question, snippets[0]));

			const option = await vscode.window.showInformationMessage('Pasted snippet from question: ' + question.title, 'Open in browser');
			if (option === 'Open in browser') {
				vscode.env.openExternal(vscode.Uri.parse(question.link));
			}
		} else {
			vscode.window.showErrorMessage('Searched far and wide but no results were found.');
		}
	});

	context.subscriptions.push(luckyDisposable);

	// PasteOverflow: Search and paste
	const pasteDisposable = vscode.commands.registerCommand('pasteoverflow.findAndPaste', async () => {
		const query = await editorQuery();
		const editor = vscode.window.activeTextEditor;

		if (!query || !editor) {
			return;
		}

		// Get current language.
		let languageId: string = editor.document.languageId;
		const results = await findMany(query, tagsFromLanguageId(languageId), true);

		if (results.length > 0) {
			const questionTitle = await vscode.window.showQuickPick(results.map(
				(result) => result.question.question_id + ': ' + result.question.title)
			);

			if (questionTitle) {
				const questionId = parseInt(questionTitle.split(':')[0]);
				const result = results.find((result) => result.question.question_id === questionId);

				if (result) {
					const { question, snippets } = result;
					editor.insertSnippet(createSnippet(question, snippets[0]));
		
					const option = await vscode.window.showInformationMessage('Pasted snippet from question: ' + question.title, 'Open in browser');
					if (option === 'Open in browser') {
						vscode.env.openExternal(vscode.Uri.parse(question.link));
					}
				}
			}
		} else {
			vscode.window.showErrorMessage('Searched far and wide but no results were found.');
		}
	});

	// PasteOverflow: Search and open
	const openDisposable = vscode.commands.registerCommand('pasteoverflow.findAndOpen', async () => {
		const query = await editorQuery();
		const editor = vscode.window.activeTextEditor;

		if (!query || !editor) {
			return;
		}

		// Get current language.
		let languageId: string = editor.document.languageId;
		const results = await findMany(query, tagsFromLanguageId(languageId), true);

		if (results.length > 0) {
			const questionTitle = await vscode.window.showQuickPick(results.map(
				(result) => result.question.question_id + ': ' + result.question.title)
			);

			if (questionTitle) {
				const questionId = parseInt(questionTitle.split(':')[0]);
				const result = results.find((result) => result.question.question_id === questionId);

				if (result) {
					vscode.env.openExternal(vscode.Uri.parse(result.question.link));
				}
			}
		} else {
			vscode.window.showErrorMessage('Searched far and wide but no results were found.');
		}
	});

	context.subscriptions.push(openDisposable);
}

export function deactivate() {}
