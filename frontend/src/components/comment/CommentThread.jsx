import CommentItem from './CommentItem'

export default function CommentThread({ comments, postId, depth = 0 }) {
  if (!comments || comments.length === 0) return null

  return (
    <div className="comment-thread">
      {comments.map(comment => (
        <div key={comment.id}>
          <CommentItem comment={comment} postId={postId} depth={depth} />
          {comment.replies && comment.replies.length > 0 && (
            <CommentThread
              comments={comment.replies}
              postId={postId}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </div>
  )
}
