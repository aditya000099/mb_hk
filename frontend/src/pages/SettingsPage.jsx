import PageLayout from '../components/layout/PageLayout'
import { Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import { useState } from 'react'

const SETTINGS_SECTIONS = [
  {
    id: 'account',
    label: 'Account',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    id: 'privacy',
    label: 'Privacy & Safety',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    ),
  },
]

export default function SettingsPage() {
  const user = useAuthStore(s => s.user)
  const [active, setActive] = useState('account')

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Settings Header */}
      <div className="bg-[#0B1416] border-b border-[#2A3236] py-4 px-5">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-[#82959b] hover:text-[#d7dadc] transition-colors text-sm">Reddit</Link>
            <span className="text-[#82959b]">/</span>
            <span className="text-sm text-[#d7dadc] font-bold">Settings</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-5 py-6 flex gap-6">
        {/* Sidebar Nav */}
        <div className="w-[220px] shrink-0">
          <nav className="bg-[#0f1113] border border-[#2A3236] rounded-xl overflow-hidden sticky top-[68px]">
            <div className="p-4 border-b border-[#2A3236]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#82959b]">Settings</p>
            </div>
            {SETTINGS_SECTIONS.map(section => (
              <button
                key={section.id}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-left ${
                  active === section.id
                    ? 'bg-[rgba(255,69,0,0.12)] text-[#FF4500] border-r-2 border-[#FF4500]'
                    : 'text-[#d7dadc] hover:bg-[rgba(255,255,255,0.06)]'
                }`}
                onClick={() => setActive(section.id)}
              >
                <span className={active === section.id ? 'text-[#FF4500]' : 'text-[#82959b]'}>
                  {section.icon}
                </span>
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <SettingsContent active={active} user={user} />
        </div>
      </div>
    </div>
  )
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-[#2A3236] last:border-none">
      <div className="flex-1">
        <p className="text-sm font-medium text-[#d7dadc]">{label}</p>
        {description && <p className="text-xs text-[#82959b] mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ defaultOn = false }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <button
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${on ? 'bg-[#46d160]' : 'bg-[#2A3236]'}`}
      onClick={() => setOn(p => !p)}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )
}

function SettingsContent({ active, user }) {
  const cardClass = "bg-[#0f1113] border border-[#2A3236] rounded-xl overflow-hidden"

  if (active === 'account') return (
    <div className="flex flex-col gap-4">
      <div className={cardClass}>
        <div className="px-5 py-4 border-b border-[#2A3236]">
          <h2 className="text-base font-bold text-[#d7dadc]">Account Settings</h2>
          <p className="text-xs text-[#82959b] mt-0.5">Manage your Reddit account details</p>
        </div>
        <div className="px-5">
          <SettingRow label="Username" description="Your Reddit username cannot be changed.">
            <span className="text-sm text-[#82959b] font-mono bg-[#1A282D] px-2 py-1 rounded">u/{user?.username}</span>
          </SettingRow>
          <SettingRow label="Email" description="Used to recover your account and receive notifications.">
            <span className="text-sm text-[#82959b] font-mono bg-[#1A282D] px-2 py-1 rounded">{user?.email}</span>
          </SettingRow>
          <SettingRow label="Account Created" description="The date your Reddit account was created.">
            <span className="text-sm text-[#82959b]">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
            </span>
          </SettingRow>
        </div>
      </div>
      <div className={cardClass}>
        <div className="px-5 py-4 border-b border-[#2A3236]">
          <h2 className="text-base font-bold text-[#d7dadc]">Karma</h2>
          <p className="text-xs text-[#82959b] mt-0.5">Karma is a reflection of how much your contributions mean to the community.</p>
        </div>
        <div className="px-5">
          <SettingRow label="Post Karma" description="Earned from upvotes on your posts.">
            <span className="text-sm font-bold text-[#FF4500]">{(user?.post_karma || 0).toLocaleString()}</span>
          </SettingRow>
          <SettingRow label="Comment Karma" description="Earned from upvotes on your comments.">
            <span className="text-sm font-bold text-[#FF4500]">{(user?.comment_karma || 0).toLocaleString()}</span>
          </SettingRow>
          <SettingRow label="Total Karma">
            <span className="text-sm font-bold text-[#d7dadc]">{((user?.post_karma || 0) + (user?.comment_karma || 0)).toLocaleString()}</span>
          </SettingRow>
        </div>
      </div>
    </div>
  )

  if (active === 'profile') return (
    <div className={cardClass}>
      <div className="px-5 py-4 border-b border-[#2A3236]">
        <h2 className="text-base font-bold text-[#d7dadc]">Profile Settings</h2>
        <p className="text-xs text-[#82959b] mt-0.5">Customize how you appear to other Redditors.</p>
      </div>
      <div className="px-5">
        <SettingRow label="Edit Profile" description="Update your display name, bio, avatar, and banner.">
          <Link
            to={`/u/${user?.username}`}
            className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#FF4500] text-white hover:bg-[#e03d00] transition-colors"
          >
            Go to Profile
          </Link>
        </SettingRow>
        <SettingRow label="Display Name" description="Your public display name.">
          <span className="text-sm text-[#82959b]">{user?.display_name || '—'}</span>
        </SettingRow>
        <SettingRow label="Bio" description="A brief description about yourself.">
          <span className="text-sm text-[#82959b] max-w-[200px] text-right">{user?.bio || 'No bio set'}</span>
        </SettingRow>
      </div>
    </div>
  )

  if (active === 'privacy') return (
    <div className={cardClass}>
      <div className="px-5 py-4 border-b border-[#2A3236]">
        <h2 className="text-base font-bold text-[#d7dadc]">Privacy & Safety</h2>
        <p className="text-xs text-[#82959b] mt-0.5">Control your privacy and safety settings.</p>
      </div>
      <div className="px-5">
        <SettingRow label="Show active communities" description="Allow others to see which communities you're active in.">
          <Toggle defaultOn={true} />
        </SettingRow>
        <SettingRow label="Allow direct messages" description="Let other Redditors send you messages.">
          <Toggle defaultOn={true} />
        </SettingRow>
        <SettingRow label="Show NSFW content" description="Allow adult content to appear in your feeds.">
          <Toggle defaultOn={false} />
        </SettingRow>
        <SettingRow label="Mark my posts as NSFW" description="All your future posts will be marked as NSFW.">
          <Toggle defaultOn={false} />
        </SettingRow>
      </div>
    </div>
  )

  if (active === 'notifications') return (
    <div className={cardClass}>
      <div className="px-5 py-4 border-b border-[#2A3236]">
        <h2 className="text-base font-bold text-[#d7dadc]">Notification Settings</h2>
        <p className="text-xs text-[#82959b] mt-0.5">Manage what you're notified about.</p>
      </div>
      <div className="px-5">
        <SettingRow label="Replies to my comments" description="Get notified when someone replies to your comments.">
          <Toggle defaultOn={true} />
        </SettingRow>
        <SettingRow label="Upvotes on my posts" description="Get notified when your posts receive upvotes.">
          <Toggle defaultOn={true} />
        </SettingRow>
        <SettingRow label="Comments on my posts" description="Get notified when someone comments on your posts.">
          <Toggle defaultOn={true} />
        </SettingRow>
        <SettingRow label="Mentions of my username" description="Get notified when someone mentions u/{user?.username}.">
          <Toggle defaultOn={true} />
        </SettingRow>
        <SettingRow label="New followers" description="Get notified when someone follows you.">
          <Toggle defaultOn={false} />
        </SettingRow>
      </div>
    </div>
  )

  if (active === 'appearance') return (
    <div className={cardClass}>
      <div className="px-5 py-4 border-b border-[#2A3236]">
        <h2 className="text-base font-bold text-[#d7dadc]">Appearance</h2>
        <p className="text-xs text-[#82959b] mt-0.5">Customize how Reddit looks for you.</p>
      </div>
      <div className="px-5">
        <SettingRow label="Dark Mode" description="Use the dark theme across Reddit. Currently active.">
          <Toggle defaultOn={true} />
        </SettingRow>
        <SettingRow label="Compact view" description="Show more posts per page with reduced whitespace.">
          <Toggle defaultOn={false} />
        </SettingRow>
        <SettingRow label="Reduce animations" description="Limit animations for better performance or comfort.">
          <Toggle defaultOn={false} />
        </SettingRow>
        <SettingRow label="Show post previews" description="Expand preview images in the feed.">
          <Toggle defaultOn={true} />
        </SettingRow>
      </div>
    </div>
  )

  return null
}
