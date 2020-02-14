import { AllHtmlEntities } from 'html-entities';
import fetch from 'node-fetch';

const entities = new AllHtmlEntities();

interface SEOwner {
	reputation: number;
	user_id: number;
	user_type: string;
	profile_image: string;
	display_name: string;
	link: string;
};

interface SEQuestionItem {
	tags: string[];
	owner: SEOwner;
	is_answered: boolean;
	view_count: boolean;
	answer_count: number;
	score: number;
	last_activity_date: number;
	creation_date: number;
	question_id: number;
	link: string;
	title: string;
	body: string;
};

interface SEQuestionResponse {
	items: SEQuestionItem[];
};

interface SEAnswerItem {
	tags: string[];
	owner: SEOwner;
	is_accepted: boolean;
	score: boolean;
	last_activity_date: number;
	last_edit_date: number;
	creation_date: number;
	answer_id: number;
	question_id: number;
	body_markdown: string;
};

interface SEAnswersResponse {
	items: SEAnswerItem[];
};

interface POResult {
	question: SEQuestionItem,
	answer: SEAnswerItem,
	snippets: string[],
};

export function getSnippets(body: string) {
	let snippets: string[] = [];

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

	return snippets;
}

export async function search(query: string, tag?: string) {
	let url = 'https://api.stackexchange.com/2.2/search/advanced?order=desc&sort=relevance&accepted=True&answers=1&site=stackoverflow';
	url += '&q=' + encodeURIComponent(query);

	if (tag) {
		url += '&tagged=' + encodeURIComponent(tag);
	}

	let res = await fetch(url);
	const json = await res.json() as SEQuestionResponse;
	return json.items;
}

export async function getAnswers(questionId: number | string) {
	let url = 'https://api.stackexchange.com/2.2/questions/' + questionId + '/answers?order=desc&sort=activity&site=stackoverflow&filter=!9Z(-wzftf';

	let res = await fetch(url);
	const json = await res.json() as SEAnswersResponse;
	return json.items;
}

export async function findBest(query: string, tags: (string | undefined)[], needSnippet = false) {
	for (let tag of tags) {
		const questions = await search(query, tag);
		const answers = await getAnswers(questions.map((question) => question.question_id).join(';'));

		for (let answer of answers) {
			const question = questions.find((question) => question.question_id === answer.question_id) as SEQuestionItem;
			const snippets = getSnippets(answers[0].body_markdown);

			if (!needSnippet || snippets.length > 0) {
				return {
					question,
					answer,
					snippets,
				};
			}
		}
	}

	return null;
}

export async function findMany(query: string, tags: (string | undefined)[], needSnippet = false, count = 5) {
	let results: POResult[] = [];

	for (let tag of tags) {
		const questions = await search(query, tag);
		const answers = await getAnswers(questions.map((question) => question.question_id).join(';'));

		for (let answer of answers) {
			const question = questions.find((question) => question.question_id === answer.question_id) as SEQuestionItem;
			const snippets = getSnippets(answers[0].body_markdown);

			if ((!needSnippet || snippets.length > 0) &&
				(!results.find((result) => result.question.question_id === question.question_id))) {
				results.push({
					question,
					answer,
					snippets,
				});

				if (results.length >= count) {
					return results;
				}
			}
		}
	}

	return results;
}

export function tagsFromLanguageId(languageId: string) {
	let tags: (string | undefined)[] = [];

	switch (languageId) {
		case 'csharp':
			tags.push('c#');
			break;
		case 'cpp':
			tags.push('c++');
			break;
		case 'scss':
			tags.push('css');
			tags.push('scss');
			break;
		case 'javascriptreact':
			tags.push('javascript');
			tags.push('reactjs');
			break;
		case 'typescriptreact':
			tags.push('javascript');
			tags.push('reactjs');
			tags.push('typescript');
			break;
		case 'typescript':
			tags.push('javascript');
			tags.push('typescript');
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
	return tags;
}