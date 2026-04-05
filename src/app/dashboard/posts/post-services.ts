import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PostModel, PostCommentModel, LikeModel, CreatePostRequest, CreateCommentRequest } from './post-model';
import { LoginService } from '../../login/login-service';

// --- DTOs matching backend API ---

export interface PostDto {
    id: string;
    title: string;
    content: string;
    category?: string;
    authorId: string;
    authorName: string;
    residenceId: string;
    createdAt: string;
    updatedAt: string;
    likesCount: number;
    commentsCount: number;
    isLikedByCurrentUser: boolean;
}

export interface CreatePostDto {
    title: string;
    content: string;
    category?: string;
}

export interface UpdatePostDto {
    title?: string;
    content?: string;
    category?: string;
}

export interface PostCommentDto {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    postId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePostCommentDto {
    content: string;
}

export interface PaginatedResult<T> {
    items: T[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

@Injectable({
    providedIn: 'root',
})
export class PostServices {
    private apiUrl = `${environment.apiUrl}/residences`;
    private residenceId = environment.residenceId;

    private postsSubject = new BehaviorSubject<PostModel[]>([]);
    posts$ = this.postsSubject.asObservable();

    // Pagination state
    private paginationSubject = new BehaviorSubject<Omit<PaginatedResult<any>, 'items'>>({
        totalCount: 0,
        pageNumber: 1,
        pageSize: 10,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
    });
    pagination$ = this.paginationSubject.asObservable();

    constructor(
        private http: HttpClient,
        private loginService: LoginService
    ) { }

    private getCurrentUserId(): string {
        return this.loginService.getCurrentUserId() || '';
    }

    private getCurrentUserName(): string {
        const user = this.loginService.getCurrentUser();
        if (!user) return 'Unknown User';
        return user.fullName || `${user.firstName} ${user.lastName}`;
    }

    /**
     * Load all posts from backend with pagination.
     * Updates the internal BehaviorSubject for backward-compatible template subscriptions.
     */
    loadPosts(pageNumber: number = 1, pageSize: number = 10): Observable<PaginatedResult<PostDto>> {
        let params = new HttpParams()
            .set('pageNumber', pageNumber.toString())
            .set('pageSize', pageSize.toString());

        const currentUserId = this.getCurrentUserId();
        if (currentUserId) {
            params = params.set('currentUserId', currentUserId);
        }

        return this.http.get<PaginatedResult<PostDto>>(
            `${this.apiUrl}/${this.residenceId}/posts`,
            { params }
        ).pipe(
            tap(result => {
                const mapped: PostModel[] = result.items.map(p => this.mapPostDtoToModel(p));
                this.postsSubject.next(mapped);
                this.paginationSubject.next({
                    totalCount: result.totalCount,
                    pageNumber: result.pageNumber,
                    pageSize: result.pageSize,
                    totalPages: result.totalPages,
                    hasPreviousPage: result.hasPreviousPage,
                    hasNextPage: result.hasNextPage,
                });
            })
        );
    }

    /**
     * Create a new post via backend API.
     */
    addPost(request: CreatePostRequest): Observable<PostDto> {
        const authorId = this.getCurrentUserId();
        let params = new HttpParams().set('authorId', authorId);

        const createDto: CreatePostDto = {
            title: '', // Posts may not have titles in the current UI
            content: request.content,
        };

        return this.http.post<PostDto>(
            `${this.apiUrl}/${this.residenceId}/posts`,
            createDto,
            { params }
        ).pipe(
            tap(newPost => {
                const mapped = this.mapPostDtoToModel(newPost);
                // If we have image/gif from the request, attach them locally
                if (request.imageUrl) mapped.imageUrl = request.imageUrl;
                if (request.gifUrl) mapped.gifUrl = request.gifUrl;
                const currentPosts = this.postsSubject.value;
                this.postsSubject.next([mapped, ...currentPosts]);
            })
        );
    }

    /**
     * Update a post via backend API.
     */
    updatePost(postId: string, content: string, imageUrl?: string, gifUrl?: string): Observable<PostDto> {
        const updateDto: UpdatePostDto = {
            content,
        };

        return this.http.put<PostDto>(
            `${this.apiUrl}/${this.residenceId}/posts/${postId}`,
            updateDto
        ).pipe(
            tap(updatedPost => {
                const currentPosts = this.postsSubject.value;
                const index = currentPosts.findIndex(p => p.id === postId);
                if (index !== -1) {
                    currentPosts[index] = {
                        ...this.mapPostDtoToModel(updatedPost),
                        imageUrl,
                        gifUrl,
                    };
                    this.postsSubject.next([...currentPosts]);
                }
            })
        );
    }

    /**
     * Delete a post via backend API.
     */
    deletePost(postId: string): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}/${this.residenceId}/posts/${postId}`
        ).pipe(
            tap(() => {
                const currentPosts = this.postsSubject.value;
                this.postsSubject.next(currentPosts.filter(p => p.id !== postId));
            })
        );
    }

    /**
     * Like a post via backend API.
     */
    likePost(postId: string): Observable<PostDto> {
        const userId = this.getCurrentUserId();
        let params = new HttpParams().set('userId', userId);

        return this.http.post<PostDto>(
            `${this.apiUrl}/${this.residenceId}/posts/${postId}/likes`,
            {},
            { params }
        ).pipe(
            tap(updatedPost => {
                this.updatePostInSubject(postId, updatedPost);
            })
        );
    }

    /**
     * Remove a like from a post via backend API.
     */
    removeLike(postId: string): Observable<void> {
        const userId = this.getCurrentUserId();

        return this.http.delete<void>(
            `${this.apiUrl}/${this.residenceId}/posts/${postId}/likes/${userId}`
        ).pipe(
            tap(() => {
                // Update local state - remove the like
                const currentPosts = this.postsSubject.value;
                const postIndex = currentPosts.findIndex(p => p.id === postId);
                if (postIndex !== -1) {
                    const post = currentPosts[postIndex];
                    post.likes = post.likes.filter(l => l.userId !== userId);
                    currentPosts[postIndex] = { ...post };
                    this.postsSubject.next([...currentPosts]);
                }
            })
        );
    }

    /**
     * Toggle like on a post: likes if not already liked, unlikes if already liked.
     */
    toggleLike(postId: string): Observable<PostDto | void> {
        if (this.isLikedByCurrentUser(postId)) {
            return this.removeLike(postId);
        } else {
            return this.likePost(postId);
        }
    }

    /**
     * Check if the current user has liked a post.
     */
    isLikedByCurrentUser(postId: string): boolean {
        const posts = this.postsSubject.value;
        const post = posts.find(p => p.id === postId);
        if (!post) return false;
        return post.likes.some(l => l.userId === this.getCurrentUserId());
    }

    /**
     * Check if the current user is the author of a post.
     */
    isAuthor(postId: string): boolean {
        const posts = this.postsSubject.value;
        const post = posts.find(p => p.id === postId);
        if (!post) return false;
        return post.authorId === this.getCurrentUserId();
    }

    /**
     * Add a comment to a post via backend API.
     */
    addComment(request: CreateCommentRequest): Observable<PostCommentDto> {
        const authorId = this.getCurrentUserId();
        let params = new HttpParams().set('authorId', authorId);

        const createCommentDto: CreatePostCommentDto = {
            content: request.content
        };

        return this.http.post<PostCommentDto>(
            `${this.apiUrl}/${this.residenceId}/posts/${request.postId}/comments`,
            createCommentDto,
            { params }
        ).pipe(
            tap(newComment => {
                // Add comment to local state
                const currentPosts = this.postsSubject.value;
                const postIndex = currentPosts.findIndex(p => p.id === request.postId);
                if (postIndex !== -1) {
                    const comment: PostCommentModel = {
                        id: newComment.id,
                        postId: newComment.postId,
                        authorId: newComment.authorId,
                        authorName: newComment.authorName,
                        authorRole: 'resident',
                        content: newComment.content,
                        createdAt: new Date(newComment.createdAt),
                    };
                    currentPosts[postIndex].comments.push(comment);
                    this.postsSubject.next([...currentPosts]);
                }
            })
        );
    }

    /**
     * Remove a comment via backend API.
     */
    removeComment(commentId: string): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}/${this.residenceId}/posts/comments/${commentId}`
        ).pipe(
            tap(() => {
                // Remove comment from local state
                const currentPosts = this.postsSubject.value;
                for (const post of currentPosts) {
                    const commentIndex = post.comments.findIndex(c => c.id === commentId);
                    if (commentIndex !== -1) {
                        post.comments.splice(commentIndex, 1);
                        break;
                    }
                }
                this.postsSubject.next([...currentPosts]);
            })
        );
    }

    /**
     * Get comments for a specific post from the backend.
     */
    getPostComments(postId: string): Observable<PostCommentDto[]> {
        return this.http.get<PostCommentDto[]>(
            `${this.apiUrl}/${this.residenceId}/posts/${postId}/comments`
        );
    }

    /**
     * Get a single post by ID from the backend.
     */
    getPostById(id: string): Observable<PostDto> {
        let params = new HttpParams();
        const currentUserId = this.getCurrentUserId();
        if (currentUserId) {
            params = params.set('currentUserId', currentUserId);
        }

        return this.http.get<PostDto>(
            `${this.apiUrl}/${this.residenceId}/posts/${id}`,
            { params }
        );
    }

    /**
     * Get a post from local state (synchronous, for quick lookups).
     */
    getPostFromLocal(id: string): PostModel | undefined {
        return this.postsSubject.value.find(p => p.id === id);
    }

    // --- Private helpers ---

    private updatePostInSubject(postId: string, updatedDto: PostDto): void {
        const currentPosts = this.postsSubject.value;
        const index = currentPosts.findIndex(p => p.id === postId);
        if (index !== -1) {
            // Preserve comments and local-only fields
            const existingPost = currentPosts[index];
            currentPosts[index] = {
                ...this.mapPostDtoToModel(updatedDto),
                comments: existingPost.comments,
                imageUrl: existingPost.imageUrl,
                gifUrl: existingPost.gifUrl,
            };
            this.postsSubject.next([...currentPosts]);
        }
    }

    /**
     * Map a backend PostDto to the local PostModel.
     */
    private mapPostDtoToModel(dto: PostDto): PostModel {
        return {
            id: dto.id,
            authorId: dto.authorId,
            authorName: dto.authorName,
            authorRole: 'resident', // Backend doesn't distinguish roles in PostDto
            content: dto.content,
            createdAt: new Date(dto.createdAt),
            updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : undefined,
            likes: [], // Likes are represented as a count in PostDto; populate if needed
            comments: [], // Comments are fetched separately
        };
    }
}
