import { useInfiniteQuery } from '@tanstack/react-query'
import { useEffect, useRef, useCallback } from 'react'
import PostCard from './PostCard'
import SkeletonCard from '../ui/SkeletonCard'

export default function PostFeed({ fetchFn, sort, timeFilter, queryKey }) {
  const bottomRef = useRef(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: queryKey || ['posts', sort, timeFilter],
    queryFn: ({ pageParam = null }) =>
      fetchFn({ sort, t: timeFilter, after: pageParam }),
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    staleTime: 1000 * 60 * 2,
  })

  const handleObserver = useCallback(
    (entries) => {
      const [entry] = entries
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  )

  useEffect(() => {
    const el = bottomRef.current
    if (!el) return
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleObserver])

  const allPosts = data?.pages?.flatMap(p => p.posts ?? p) ?? []

  if (isLoading) {
    return (
      <>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </>
    )
  }

  if (isError) {
    return (
      <div className="feed-error">
        <p>Failed to load posts. {error?.message}</p>
      </div>
    )
  }

  if (allPosts.length === 0) {
    return (
      <div className="feed-empty">
        <p>No posts yet. Be the first to post!</p>
      </div>
    )
  }

  return (
    <div>
      {allPosts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
      {isFetchingNextPage && <SkeletonCard />}
      <div ref={bottomRef} style={{ height: 1 }} />
    </div>
  )
}
