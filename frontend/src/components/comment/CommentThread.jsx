import CommentItem from './CommentItem'

// Renders only the top-level comments; CommentItem handles nested replies internally.
export default function CommentThread({ comments, postId, depth = 0 }) {
  if (!comments || comments.length === 0) return null

  return (
    <div className="comment-thread">
      {comments.map(comment => (
        <CommentItem key={comment.id} comment={comment} postId={postId} depth={depth} />
      ))}
    </div>
  )
}
