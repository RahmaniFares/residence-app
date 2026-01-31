import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PostModel, PostCommentModel, LikeModel, CreatePostRequest, CreateCommentRequest } from './post-model';

@Injectable({
    providedIn: 'root',
})
export class PostServices {

    private postsSubject = new BehaviorSubject<PostModel[]>([
        {
            id: 'POST-1001',
            authorId: 'USER-001',
            authorName: 'Admin User',
            authorRole: 'admin',
            content: '🎉 Welcome to our residence community! We are excited to launch this new communication platform where residents and administrators can share updates, announcements, and connect with each other. Feel free to post and engage!',
            createdAt: new Date(Date.now() - 86400000 * 3),
            likes: [
                { id: 'LIKE-1', userId: 'USER-002', userName: 'Sarah Jenkins', createdAt: new Date(Date.now() - 86400000 * 2) },
                { id: 'LIKE-2', userId: 'USER-003', userName: 'Michael Wong', createdAt: new Date(Date.now() - 86400000 * 2) },
                { id: 'LIKE-3', userId: 'USER-004', userName: 'Emma Davis', createdAt: new Date(Date.now() - 86400000) }
            ],
            comments: [
                {
                    id: 'CMT-1001',
                    postId: 'POST-1001',
                    authorId: 'USER-002',
                    authorName: 'Sarah Jenkins',
                    authorRole: 'resident',
                    content: 'This is wonderful! Great initiative. 👏',
                    createdAt: new Date(Date.now() - 86400000 * 2)
                },
                {
                    id: 'CMT-1002',
                    postId: 'POST-1001',
                    authorId: 'USER-003',
                    authorName: 'Michael Wong',
                    authorRole: 'resident',
                    content: 'Looking forward to connecting with everyone!',
                    createdAt: new Date(Date.now() - 86400000)
                }
            ]
        },
        {
            id: 'POST-1002',
            authorId: 'USER-002',
            authorName: 'Sarah Jenkins',
            authorRole: 'resident',
            content: '🏋️ Just a reminder that the gym will be closed for maintenance this Saturday from 8 AM to 12 PM. Plan your workouts accordingly!',
            createdAt: new Date(Date.now() - 86400000 * 2),
            likes: [
                { id: 'LIKE-4', userId: 'USER-001', userName: 'Admin User', createdAt: new Date(Date.now() - 86400000) },
                { id: 'LIKE-5', userId: 'USER-004', userName: 'Emma Davis', createdAt: new Date(Date.now() - 86400000) }
            ],
            comments: []
        },
        {
            id: 'POST-1003',
            authorId: 'USER-001',
            authorName: 'Admin User',
            authorRole: 'admin',
            content: '🚗 Parking Notice: Starting next Monday, all vehicles must display the new parking permits. Please collect yours from the management office. Non-compliance may result in penalties.',
            imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=60',
            createdAt: new Date(Date.now() - 86400000),
            likes: [
                { id: 'LIKE-6', userId: 'USER-005', userName: 'David Miller', createdAt: new Date(Date.now() - 43200000) }
            ],
            comments: [
                {
                    id: 'CMT-1003',
                    postId: 'POST-1003',
                    authorId: 'USER-005',
                    authorName: 'David Miller',
                    authorRole: 'resident',
                    content: 'What are the office hours for permit collection?',
                    createdAt: new Date(Date.now() - 43200000)
                },
                {
                    id: 'CMT-1004',
                    postId: 'POST-1003',
                    authorId: 'USER-001',
                    authorName: 'Admin User',
                    authorRole: 'admin',
                    content: 'Office hours are 9 AM to 5 PM, Monday to Friday. You can also collect on Saturday between 10 AM to 2 PM.',
                    createdAt: new Date(Date.now() - 36000000)
                }
            ]
        },
        {
            id: 'POST-1004',
            authorId: 'USER-004',
            authorName: 'Emma Davis',
            authorRole: 'resident',
            content: '🌸 Beautiful flowers blooming in the community garden! Spring is finally here.',
            imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop&q=60',
            createdAt: new Date(Date.now() - 3600000 * 5),
            likes: [
                { id: 'LIKE-7', userId: 'USER-001', userName: 'Admin User', createdAt: new Date(Date.now() - 3600000 * 4) },
                { id: 'LIKE-8', userId: 'USER-002', userName: 'Sarah Jenkins', createdAt: new Date(Date.now() - 3600000 * 3) },
                { id: 'LIKE-9', userId: 'USER-003', userName: 'Michael Wong', createdAt: new Date(Date.now() - 3600000 * 2) },
                { id: 'LIKE-10', userId: 'USER-005', userName: 'David Miller', createdAt: new Date(Date.now() - 3600000) }
            ],
            comments: []
        }
    ]);

    posts$ = this.postsSubject.asObservable();

    private getCurrentUser() {
        const userStr = localStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : { firstName: 'Admin', lastName: 'User', email: 'admin' };
    }

    private getCurrentUserId(): string {
        const user = this.getCurrentUser();
        return user.email || 'USER-001';
    }

    private getCurrentUserName(): string {
        const user = this.getCurrentUser();
        return `${user.firstName} ${user.lastName}`;
    }

    addPost(request: CreatePostRequest): void {
        const currentPosts = this.postsSubject.value;
        const lastId = currentPosts.length > 0
            ? parseInt(currentPosts[0].id.split('-')[1])
            : 1000;

        const newPost: PostModel = {
            id: `POST-${lastId + 1}`,
            authorId: this.getCurrentUserId(),
            authorName: this.getCurrentUserName(),
            authorRole: 'admin', // Assuming logged in user is admin for now
            content: request.content,
            imageUrl: request.imageUrl,
            gifUrl: request.gifUrl,
            createdAt: new Date(),
            likes: [],
            comments: []
        };

        this.postsSubject.next([newPost, ...currentPosts]);
    }

    updatePost(postId: string, content: string, imageUrl?: string, gifUrl?: string): boolean {
        const currentPosts = this.postsSubject.value;
        const postIndex = currentPosts.findIndex(p => p.id === postId);

        if (postIndex === -1) return false;

        const post = currentPosts[postIndex];

        // Check if current user is the author
        if (post.authorId !== this.getCurrentUserId()) {
            console.warn('Only the author can update this post');
            return false;
        }

        currentPosts[postIndex] = {
            ...post,
            content,
            imageUrl,
            gifUrl,
            updatedAt: new Date()
        };

        this.postsSubject.next([...currentPosts]);
        return true;
    }

    deletePost(postId: string): boolean {
        const currentPosts = this.postsSubject.value;
        const post = currentPosts.find(p => p.id === postId);

        if (!post) return false;

        // Check if current user is the author
        if (post.authorId !== this.getCurrentUserId()) {
            console.warn('Only the author can delete this post');
            return false;
        }

        this.postsSubject.next(currentPosts.filter(p => p.id !== postId));
        return true;
    }

    toggleLike(postId: string): void {
        const currentPosts = this.postsSubject.value;
        const postIndex = currentPosts.findIndex(p => p.id === postId);

        if (postIndex === -1) return;

        const post = currentPosts[postIndex];
        const userId = this.getCurrentUserId();
        const existingLikeIndex = post.likes.findIndex(l => l.userId === userId);

        if (existingLikeIndex !== -1) {
            // Unlike
            post.likes.splice(existingLikeIndex, 1);
        } else {
            // Like
            const newLike: LikeModel = {
                id: `LIKE-${Date.now()}`,
                userId,
                userName: this.getCurrentUserName(),
                createdAt: new Date()
            };
            post.likes.push(newLike);
        }

        currentPosts[postIndex] = { ...post };
        this.postsSubject.next([...currentPosts]);
    }

    isLikedByCurrentUser(postId: string): boolean {
        const posts = this.postsSubject.value;
        const post = posts.find(p => p.id === postId);
        if (!post) return false;

        return post.likes.some(l => l.userId === this.getCurrentUserId());
    }

    isAuthor(postId: string): boolean {
        const posts = this.postsSubject.value;
        const post = posts.find(p => p.id === postId);
        if (!post) return false;

        return post.authorId === this.getCurrentUserId();
    }

    addComment(request: CreateCommentRequest): void {
        const currentPosts = this.postsSubject.value;
        const postIndex = currentPosts.findIndex(p => p.id === request.postId);

        if (postIndex === -1) return;

        const newComment: PostCommentModel = {
            id: `CMT-${Date.now()}`,
            postId: request.postId,
            authorId: this.getCurrentUserId(),
            authorName: this.getCurrentUserName(),
            authorRole: 'admin',
            content: request.content,
            createdAt: new Date()
        };

        currentPosts[postIndex].comments.push(newComment);
        this.postsSubject.next([...currentPosts]);
    }

    getPostById(id: string): PostModel | undefined {
        return this.postsSubject.value.find(p => p.id === id);
    }
}
