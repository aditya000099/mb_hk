import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import PageLayout from '../components/layout/PageLayout';
import { createPost } from '../api/posts';
import { getPopularSubreddits } from '../api/subreddits';
import { useRef } from 'react';

const TOOLBAR_ICONS = [
  <svg
    key="img"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-5 h-5"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21 15 16 10 5 21"></polyline>
  </svg>,
  <svg
    key="vid"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-5 h-5"
  >
    <polygon points="23 7 16 12 23 17 23 7"></polygon>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
  </svg>,
  <svg
    key="link"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-5 h-5"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>,
  <span key="sep1" className="w-[1px] h-4 bg-[#2A3236] mx-1"></span>,
  <strong key="bold" className="text-lg font-serif px-1 leading-none">
    B
  </strong>,
  <em key="italic" className="text-lg font-serif px-1 leading-none italic">
    i
  </em>,
  <strike key="strike" className="text-lg font-serif px-1 leading-none">
    S
  </strike>,
  <span key="x2" className="text-sm font-serif px-1 leading-none font-bold">
    X²
  </span>,
  <svg
    key="heading"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-5 h-5"
  >
    <polyline points="4 7 4 4 20 4 20 7"></polyline>
    <line x1="9" y1="20" x2="15" y2="20"></line>
    <line x1="12" y1="4" x2="12" y2="20"></line>
  </svg>,
  <span key="sep2" className="w-[1px] h-4 bg-[#2A3236] mx-1"></span>,
  <svg
    key="link2"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-5 h-5"
  >
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>,
  <svg
    key="ul"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-5 h-5"
  >
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>,
  <svg
    key="ol"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-5 h-5"
  >
    <line x1="10" y1="6" x2="21" y2="6"></line>
    <line x1="10" y1="12" x2="21" y2="12"></line>
    <line x1="10" y1="18" x2="21" y2="18"></line>
    <line x1="4" y1="6" x2="4.01" y2="6"></line>
    <line x1="4" y1="12" x2="4.01" y2="12"></line>
    <line x1="4" y1="18" x2="4.01" y2="18"></line>
  </svg>,
  <span key="sep3" className="w-[1px] h-4 bg-[#2A3236] mx-1"></span>,
  <svg
    key="spoiler"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-5 h-5"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>,
  <span key="quote" className="text-xl font-serif px-1 leading-none">
    "
  </span>,
  <svg
    key="code"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-5 h-5"
  >
    <polyline points="16 18 22 12 16 6"></polyline>
    <polyline points="8 6 2 12 8 18"></polyline>
  </svg>,
  <svg
    key="table"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-5 h-5"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="3" y1="9" x2="21" y2="9"></line>
    <line x1="3" y1="15" x2="21" y2="15"></line>
    <line x1="9" y1="3" x2="9" y2="21"></line>
    <line x1="15" y1="3" x2="15" y2="21"></line>
  </svg>,
  <span key="sep4" className="flex-1"></span>,
  <svg
    key="dots"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-5 h-5 ml-auto"
  >
    <circle cx="5" cy="12" r="1"></circle>
    <circle cx="12" cy="12" r="1"></circle>
    <circle cx="19" cy="12" r="1"></circle>
  </svg>,
];

export default function SubmitPage() {
  const navigate = useNavigate();
  const { name: routeName } = useParams();

  const [subredditName, setSubredditName] = useState(routeName || '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const { data: popularSubs } = useQuery({
    queryKey: ['popular-subreddits'],
    queryFn: getPopularSubreddits,
    staleTime: 1000 * 60 * 10,
  });

  const submitMutation = useMutation({
    mutationFn: (data) => createPost(subredditName, data),
    onSuccess: (data) => {
      navigate(`/r/${subredditName}/comments/${data.id}`);
    },
    onError: (err) => {
      setError(
        err?.response?.data?.detail ||
        'Failed to create post. Please try again.',
      );
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!subredditName.trim()) {
      setError('Please select a community.');
      return;
    }
    if (!title.trim()) {
      setError('Please add a title.');
      return;
    }

    const data = {
      title: title.trim(),
      post_type: 'text',
      subreddit_name: subredditName,
      body: body,
    };

    submitMutation.mutate(data);
  };

  const isValid = title.trim() && subredditName;

  return (
    <PageLayout>
      <div className="flex-1 w-full max-w-[800px] mt-4">
        {/* Top Header: Select Community & Drafts */}
        <div className="flex items-center justify-between mb-8">
          <div className="relative">
            <select
              className="appearance-none bg-transparent border border-[#2A3236] text-white text-sm font-bold rounded-full h-10 pl-4 pr-10 cursor-pointer outline-none hover:bg-[#2A3236] transition-colors min-w-[200px]"
              value={subredditName}
              onChange={(e) => setSubredditName(e.target.value)}
              disabled={!!routeName}
            >
              <option value="" disabled className="text-black">
                Select Community
              </option>
              {popularSubs?.map((s) => (
                <option
                  key={s.id || s.name}
                  value={s.name}
                  className="text-black"
                >
                  r/{s.name}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex flex-col gap-[2px]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3 h-3 text-white"
              >
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3 h-3 text-white"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>
          <button className="text-sm font-bold text-white bg-transparent border-none hover:underline cursor-pointer">
            Drafts
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-[rgba(217,48,37,0.08)] border border-[rgba(217,48,37,0.3)] rounded-sm py-2.5 px-3.5 text-sm text-[#ff4d4f]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Title Input */}
          <input
            className="w-full bg-transparent border-none text-[28px] font-bold text-white outline-none placeholder:text-[#82959b] mb-4"
            placeholder="What's on your mind?*"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={300}
            required
            autoFocus
          />

          {/* Add Tags Pill */}
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2A3236] text-xs font-bold text-[#82959b] w-max mb-6 hover:bg-[#2A3236] transition-colors cursor-pointer bg-transparent"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
            Add tags
          </button>

          {/* Body Textarea */}
          <textarea
            className="w-full bg-transparent border-none text-base text-[#d7dadc] outline-none placeholder:text-[#82959b] resize-y min-h-[160px] leading-relaxed mb-4 font-sans"
            placeholder="Share the details..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          {/* Toolbar */}
          <div className="flex items-center gap-4 text-[#82959b] mb-4">
            {TOOLBAR_ICONS.map((icon, idx) => (
              <button
                key={idx}
                type="button"
                className="hover:bg-[#272729] rounded p-1 transition-colors flex items-center justify-center bg-transparent border-none cursor-pointer"
              >
                {icon}
              </button>
            ))}
          </div>

          <div className="w-full h-[1px] bg-[#2A3236] mb-4"></div>

          {/* Bottom Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-5 py-2 rounded-full font-bold text-sm bg-[#1A282D] text-[#82959b] cursor-pointer border-none transition-colors hover:bg-[#2A3236]"
              onClick={() => navigate(-1)}
            >
              Save Draft
            </button>
            <button
              type="submit"
              className={`px-6 py-2 rounded-full font-bold text-sm transition-colors border-none ${isValid
                  ? 'bg-white text-black cursor-pointer hover:bg-gray-200'
                  : 'bg-[#1A282D] text-[#82959b] cursor-not-allowed opacity-80'
                }`}
              disabled={submitMutation.isPending || !isValid}
            >
              {submitMutation.isPending ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
