import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PageLayout from '../components/layout/PageLayout'
import PostCard from '../components/post/PostCard'
import useAuthStore from '../store/authStore'
import { getUser, getUserPosts, getUserComments, getSavedItems, updateProfile, uploadMedia } from '../api/users'
import { toggleFriendRequest, getFriends } from '../api/chat'

export default function UserProfilePage() {
  const { username } = useParams()
  const currentUser = useAuthStore(s => s.user)
  const isMe = currentUser?.username === username
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState('posts')
  const [isEditing, setIsEditing] = useState(false)
  const fileInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user', username],
    queryFn: () => getUser(username),
  })

  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
    enabled: !isMe && !!currentUser && !!profile
  })

  const friendStatus = friends.find(f => f.friend_id === profile?.id || f.user_id === profile?.id)

  const friendMutation = useMutation({
    mutationFn: () => toggleFriendRequest(profile.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] })
  })

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['user-posts', username],
    queryFn: () => getUserPosts(username),
    enabled: activeTab === 'posts'
  })

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['user-comments', username],
    queryFn: () => getUserComments(username),
    enabled: activeTab === 'comments'
  })

  const { data: savedItems, isLoading: savedLoading } = useQuery({
    queryKey: ['user-saved'],
    queryFn: getSavedItems,
    enabled: activeTab === 'saved' && isMe
  })

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['user', username], data)
      setIsEditing(false)
      // also update auth store if needed
      if (isMe) {
        useAuthStore.getState().setUser({ ...currentUser, ...data })
      }
    }
  })

  const handleEditSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    updateMutation.mutate({
      display_name: formData.get('display_name'),
      bio: formData.get('bio')
    })
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const url = await uploadMedia(file)
      updateMutation.mutate({ avatar_url: url })
    } catch (err) {
      console.error(err)
      alert("Upload failed")
    }
  }

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const url = await uploadMedia(file)
      updateMutation.mutate({ banner_url: url })
    } catch (err) {
      console.error(err)
      alert("Upload failed")
    }
  }

  if (profileLoading) {
    return <PageLayout><div className="text-center p-10 text-text-muted">Loading profile...</div></PageLayout>
  }

  if (!profile) {
    return <PageLayout><div className="text-center p-10 text-text-muted">User not found.</div></PageLayout>
  }

  return (
    <PageLayout>
      <div className="flex-1 min-w-0">
        {/* Profile Tabs */}
        <div className="flex gap-4 border-b border-[#2A3236] mb-4 overflow-x-auto no-scrollbar">
          <button 
            className={`pb-3 text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'posts' ? 'text-[#d7dadc] border-b-2 border-[#d7dadc]' : 'text-[#82959b] hover:text-[#d7dadc]'}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts
          </button>
          <button 
            className={`pb-3 text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'comments' ? 'text-[#d7dadc] border-b-2 border-[#d7dadc]' : 'text-[#82959b] hover:text-[#d7dadc]'}`}
            onClick={() => setActiveTab('comments')}
          >
            Comments
          </button>
          {isMe && (
            <button 
              className={`pb-3 text-sm font-bold transition-colors whitespace-nowrap ${activeTab === 'saved' ? 'text-[#d7dadc] border-b-2 border-[#d7dadc]' : 'text-[#82959b] hover:text-[#d7dadc]'}`}
              onClick={() => setActiveTab('saved')}
            >
              Saved
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'posts' && (
          <div>
            {postsLoading ? <div className="text-text-muted">Loading posts...</div> : posts?.length > 0 ? posts.map(post => <PostCard key={post.id} post={post} />) : <div className="text-text-muted p-5 bg-[#0f1113] rounded-xl border border-[#2A3236] text-center">No posts yet.</div>}
          </div>
        )}

        {activeTab === 'comments' && (
          <div>
            {commentsLoading ? <div className="text-text-muted">Loading comments...</div> : comments?.length > 0 ? comments.map(comment => (
              <div key={comment.id} className="bg-[#0f1113] rounded-xl mb-3 border border-[#2A3236] p-4 text-sm text-[#d7dadc]">
                <div className="text-xs text-[#82959b] mb-2 font-bold">Commented on a post</div>
                <div className="pl-4 border-l-2 border-[#343435]">{comment.body}</div>
              </div>
            )) : <div className="text-text-muted p-5 bg-[#0f1113] rounded-xl border border-[#2A3236] text-center">No comments yet.</div>}
          </div>
        )}

        {activeTab === 'saved' && isMe && (
          <div>
            {savedLoading ? <div className="text-text-muted">Loading saved items...</div> : savedItems?.length > 0 ? savedItems.map(item => (
              <div key={item.saved_at} className="mb-3">
                {item.type === 'post' ? <PostCard post={item.data} /> : (
                  <div className="bg-[#0f1113] rounded-xl border border-[#2A3236] p-4 text-sm text-[#d7dadc]">
                    <div className="text-xs text-[#82959b] mb-2 font-bold">Saved Comment by u/{item.data.author_username}</div>
                    <div className="pl-4 border-l-2 border-[#343435]">{item.data.body}</div>
                  </div>
                )}
              </div>
            )) : <div className="text-text-muted p-5 bg-[#0f1113] rounded-xl border border-[#2A3236] text-center">No saved items.</div>}
          </div>
        )}
      </div>

      {/* Right Sidebar (Profile Info) */}
      <div className="hidden lg:block w-[312px] shrink-0 sticky top-[68px]">
        <div className="bg-[#0f1113] rounded-xl border border-[#2A3236] overflow-hidden">
          {/* Banner */}
          <div className="h-24 bg-[#FF4500] relative group">
            {profile.banner_url && <img src={profile.banner_url} alt="banner" className="w-full h-full object-cover" />}
            {isMe && (
              <>
                <button 
                  onClick={() => bannerInputRef.current?.click()}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold"
                >
                  Upload Banner
                </button>
                <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
              </>
            )}
          </div>
          
          <div className="p-4 relative">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-xl bg-[#0f1113] p-1 absolute -top-12 group cursor-pointer" onClick={() => isMe && fileInputRef.current?.click()}>
              <div className="w-full h-full rounded-lg overflow-hidden bg-[#272729] flex items-center justify-center relative">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-3xl text-white font-bold">{profile.username[0].toUpperCase()}</span>}
                {isMe && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </div>

            <div className="mt-8">
              {isEditing ? (
                <form onSubmit={handleEditSubmit} className="space-y-3">
                  <input type="text" name="display_name" defaultValue={profile.display_name || ''} placeholder="Display Name (optional)" className="w-full bg-[#1A282D] border border-[#2A3236] rounded p-2 text-sm text-white" />
                  <textarea name="bio" defaultValue={profile.bio || ''} placeholder="About (optional)" className="w-full bg-[#1A282D] border border-[#2A3236] rounded p-2 text-sm text-white h-20 resize-none"></textarea>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-white text-black font-bold py-1.5 rounded-full text-sm">Save</button>
                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-transparent border border-[#d7dadc] text-[#d7dadc] font-bold py-1.5 rounded-full text-sm">Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <h1 className="text-xl font-bold text-[#d7dadc]">{profile.display_name || profile.username}</h1>
                  <p className="text-xs text-[#82959b] mb-3">u/{profile.username}</p>
                  
                  {profile.bio && <p className="text-sm text-[#d7dadc] mb-4 whitespace-pre-wrap">{profile.bio}</p>}
                  
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-xs font-bold text-[#d7dadc]">{profile.post_karma + profile.comment_karma}</div>
                      <div className="text-[10px] text-[#82959b]">Karma</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#d7dadc]">{new Date(profile.created_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-[#82959b]">Cake day</div>
                    </div>
                  </div>

                  {isMe ? (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="w-full py-1.5 rounded-full bg-[#272729] hover:bg-[#343435] text-sm font-bold text-white transition-colors"
                    >
                      Edit Profile
                    </button>
                  ) : currentUser && (
                    <button 
                      onClick={() => friendMutation.mutate()}
                      disabled={friendMutation.isPending}
                      className="w-full mt-2 py-1.5 rounded-full bg-[#FF4500] hover:bg-[#e03d00] text-sm font-bold text-white transition-colors disabled:opacity-50"
                    >
                      {friendStatus 
                        ? (friendStatus.status === 'accepted' ? 'Unfriend' : 'Cancel Request / Pending') 
                        : 'Add Friend'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
