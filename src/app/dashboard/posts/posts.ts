import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PostServices } from './post-services';
import { PostModel } from './post-model';

@Component({
  selector: 'app-posts',
  imports: [CommonModule, FormsModule],
  templateUrl: './posts.html',
  styleUrl: './posts.css',
})
export class Posts {
  postService = inject(PostServices);

  // Signals
  posts = signal<PostModel[]>([]);
  newPostContent = signal('');
  newPostImageUrl = signal('');
  newPostGifUrl = signal('');
  showMediaInput = signal(false);
  mediaType = signal<'image' | 'gif' | null>(null);

  // Edit mode
  editingPostId = signal<string | null>(null);
  editContent = signal('');
  editImageUrl = signal('');
  editGifUrl = signal('');

  // Comment input per post
  commentInputs = signal<{ [postId: string]: string }>({});
  expandedComments = signal<{ [postId: string]: boolean }>({});

  constructor() {
    this.postService.posts$.subscribe(data => {
      this.posts.set(data);
    });
  }

  // Computed
  totalPosts = computed(() => this.posts().length);

  // Helpers
  getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  isLiked(postId: string): boolean {
    return this.postService.isLikedByCurrentUser(postId);
  }

  isAuthor(postId: string): boolean {
    return this.postService.isAuthor(postId);
  }

  // Actions
  createPost() {
    const content = this.newPostContent().trim();
    if (!content) return;

    this.postService.addPost({
      content,
      imageUrl: this.newPostImageUrl() || undefined,
      gifUrl: this.newPostGifUrl() || undefined
    });

    // Reset form
    this.newPostContent.set('');
    this.newPostImageUrl.set('');
    this.newPostGifUrl.set('');
    this.showMediaInput.set(false);
    this.mediaType.set(null);
  }

  toggleMediaInput(type: 'image' | 'gif') {
    if (this.mediaType() === type) {
      this.showMediaInput.set(false);
      this.mediaType.set(null);
      this.newPostImageUrl.set('');
      this.newPostGifUrl.set('');
    } else {
      this.showMediaInput.set(true);
      this.mediaType.set(type);
      if (type === 'image') {
        this.newPostGifUrl.set('');
      } else {
        this.newPostImageUrl.set('');
      }
    }
  }

  toggleLike(postId: string) {
    this.postService.toggleLike(postId);
  }

  // Edit functionality
  startEdit(post: PostModel) {
    this.editingPostId.set(post.id);
    this.editContent.set(post.content);
    this.editImageUrl.set(post.imageUrl || '');
    this.editGifUrl.set(post.gifUrl || '');
  }

  cancelEdit() {
    this.editingPostId.set(null);
    this.editContent.set('');
    this.editImageUrl.set('');
    this.editGifUrl.set('');
  }

  saveEdit(postId: string) {
    const content = this.editContent().trim();
    if (!content) return;

    this.postService.updatePost(
      postId,
      content,
      this.editImageUrl() || undefined,
      this.editGifUrl() || undefined
    );
    this.cancelEdit();
  }

  deletePost(postId: string) {
    if (confirm('Are you sure you want to delete this post?')) {
      this.postService.deletePost(postId);
    }
  }

  // Comments
  toggleComments(postId: string) {
    const expanded = this.expandedComments();
    this.expandedComments.set({
      ...expanded,
      [postId]: !expanded[postId]
    });
  }

  updateCommentInput(postId: string, value: string) {
    this.commentInputs.set({
      ...this.commentInputs(),
      [postId]: value
    });
  }

  addComment(postId: string) {
    const content = this.commentInputs()[postId]?.trim();
    if (!content) return;

    this.postService.addComment({ postId, content });

    // Clear input
    this.commentInputs.set({
      ...this.commentInputs(),
      [postId]: ''
    });
  }

  isCommentsExpanded(postId: string): boolean {
    return this.expandedComments()[postId] || false;
  }

  getCommentInput(postId: string): string {
    return this.commentInputs()[postId] || '';
  }
}
