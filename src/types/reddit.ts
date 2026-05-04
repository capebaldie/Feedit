export interface Post {
  id: string;
  title: string;
  author: string;
  score: number;
  numComments: number;
  permalink: string;
  created: number;
  flair: string | null;
  domain: string | null;
  isSelf: boolean;
}

export interface RedditPostData {
  id: string;
  title: string;
  author: string;
  score: number;
  num_comments: number;
  permalink: string;
  created: number;
  link_flair_text: string | null;
  domain: string;
  is_self: boolean;
}

export interface RedditListingChild {
  data: RedditPostData;
}

export interface RedditListing {
  data: {
    children: RedditListingChild[];
  };
}

export interface RedditAbout {
  data: {
    subreddit_type: 'public' | 'private' | 'restricted' | 'employees_only' | 'gold_restricted' | 'archived';
  };
}
