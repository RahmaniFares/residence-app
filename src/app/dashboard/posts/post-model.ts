export interface PostModel {
    id: string;
    authorId: string;
    authorName: string;
    authorRole: 'resident' | 'admin';
    authorAvatar?: string;
    content: string;
    imageUrl?: string;
    gifUrl?: string;
    createdAt: Date;
    updatedAt?: Date;
    likes: LikeModel[];
    comments: PostCommentModel[];
}

export interface LikeModel {
    id: string;
    userId: string;
    userName: string;
    createdAt: Date;
}

export interface PostCommentModel {
    id: string;
    postId: string;
    authorId: string;
    authorName: string;
    authorRole: 'resident' | 'admin';
    content: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface CreatePostRequest {
    content: string;
    imageUrl?: string;
    gifUrl?: string;
}

export interface CreateCommentRequest {
    postId: string;
    content: string;
}
