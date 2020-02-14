export interface SEOwner {
	reputation: number;
	user_id: number;
	user_type: string;
	profile_image: string;
	display_name: string;
	link: string;
};

export interface SEQuestionItem {
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

export interface SEQuestionResponse {
	items: SEQuestionItem[];
};

export interface SEAnswerItem {
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

export interface SEAnswersResponse {
	items: SEAnswerItem[];
};