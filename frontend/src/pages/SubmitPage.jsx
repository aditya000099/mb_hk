import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import PageLayout from '../components/layout/PageLayout';
import { createPost } from '../api/posts';
import { getPopularSubreddits } from '../api/subreddits';
import { uploadMedia } from '../api/users';

const TOOLBAR_ICONS = [
  { id: 'img', title: 'Add Image', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> },
  { id: 'vid', title: 'Add Video', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg> },
  { id: 'link', title: 'Add Link', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> },
  { isSeparator: true },
  { id: 'bold', title: 'Bold', icon: <strong className="text-lg font-serif px-1 leading-none">B</strong> },
  { id: 'italic', title: 'Italic', icon: <em className="text-lg font-serif px-1 leading-none italic">i</em> },
  { id: 'strike', title: 'Strikethrough', icon: <strike className="text-lg font-serif px-1 leading-none">S</strike> },
  { id: 'x2', title: 'Superscript', icon: <span className="text-sm font-serif px-1 leading-none font-bold">X²</span> },
  { id: 'heading', title: 'Heading', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg> },
  { isSeparator: true },
  { id: 'link2', title: 'Add Link', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> },
  { id: 'ul', title: 'Bulleted List', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg> },
  { id: 'ol', title: 'Numbered List', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><line x1="4" y1="6" x2="4.01" y2="6"></line><line x1="4" y1="12" x2="4.01" y2="12"></line><line x1="4" y1="18" x2="4.01" y2="18"></line></svg> },
  { isSeparator: true },
  { id: 'quote', title: 'Quote Block', icon: <span className="text-xl font-serif px-1 leading-none">"</span> },
  { id: 'code', title: 'Code Block', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg> },
  { id: 'table', title: 'Table', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg> },
  { isSpacer: true },
  { id: 'dots', title: 'More Options', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 ml-auto"><circle cx="5" cy="12" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle></svg> },
];

export default function SubmitPage() {
  const navigate = useNavigate();
  const { name: routeName } = useParams();

  const [subredditName, setSubredditName] = useState(routeName || '');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [draftSaved, setDraftSaved] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('post_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.body) setBody(parsed.body);
        if (parsed.subredditName && !routeName) setSubredditName(parsed.subredditName);
      } catch (e) {
        console.error('Failed to parse draft');
      }
    }
  }, [routeName]);

  const handleSaveDraft = () => {
    localStorage.setItem('post_draft', JSON.stringify({ title, body, subredditName }));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000);
  };

  const handleFormat = (type) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);
    let newText = '';
    let newCursorPos = end;

    switch (type) {
      case 'bold':
        newText = `**${selectedText || 'bold text'}**`;
        newCursorPos = start + newText.length;
        break;
      case 'italic':
        newText = `*${selectedText || 'italic text'}*`;
        newCursorPos = start + newText.length;
        break;
      case 'strike':
        newText = `~~${selectedText || 'strikethrough'}~~`;
        newCursorPos = start + newText.length;
        break;
      case 'code':
        newText = `\`${selectedText || 'code'}\``;
        newCursorPos = start + newText.length;
        break;
      case 'heading':
        newText = `\n# ${selectedText || 'Heading'}\n`;
        newCursorPos = start + newText.length;
        break;
      case 'quote':
        newText = `\n> ${selectedText || 'Quote'}\n`;
        newCursorPos = start + newText.length;
        break;
      case 'ul':
        newText = `\n- ${selectedText || 'List item'}\n`;
        newCursorPos = start + newText.length;
        break;
      case 'ol':
        newText = `\n1. ${selectedText || 'List item'}\n`;
        newCursorPos = start + newText.length;
        break;
      case 'link':
      case 'link2':
        newText = `[${selectedText || 'text'}](url)`;
        newCursorPos = start + newText.length - 4; // place cursor in url
        break;
      case 'img':
        imageInputRef.current?.click();
        return;
      case 'vid':
        videoInputRef.current?.click();
        return;
      case 'x2':
        newText = `^${selectedText || 'superscript'}`;
        newCursorPos = start + newText.length;
        break;
      case 'table':
        newText = `\n| Column 1 | Column 2 |\n| -------- | -------- |\n| ${selectedText || 'Cell 1'}   | Cell 2   |\n`;
        newCursorPos = start + newText.length - 12; // place cursor roughly at Cell 2
        break;
      case 'dots':
        // Just mock dots button logic
        return;
      default:
        return;
    }

    setBody(body.substring(0, start) + newText + body.substring(end));

    // Focus and restore cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleMediaUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadMedia(file);
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = body.substring(start, end);

      let newText = '';
      if (type === 'image') {
        newText = `![${selectedText || 'Image description'}](${url})`;
      } else {
        newText = `[${selectedText || 'Video description'}](${url})`;
      }

      const newCursorPos = start + newText.length;
      setBody(body.substring(0, start) + newText + body.substring(end));

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } catch (error) {
      console.error('Failed to upload media:', error);
      alert('Failed to upload media. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const { data: popularSubs } = useQuery({
    queryKey: ['popular-subreddits'],
    queryFn: getPopularSubreddits,
    staleTime: 1000 * 60 * 10,
  });

  const submitMutation = useMutation({
    mutationFn: (data) => createPost(subredditName, data),
    onSuccess: (data) => {
      localStorage.removeItem('post_draft'); // Clear draft on successful post
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

          {/* Write / Preview Toggle */}
          <div className="flex items-center gap-0 mb-3 border-b border-[#2A3236]">
            <button
              type="button"
              onClick={() => setIsPreview(false)}
              className={`px-4 py-2 text-sm font-bold border-none cursor-pointer bg-transparent transition-colors ${!isPreview
                  ? 'text-white border-b-2 border-white -mb-[2px]'
                  : 'text-[#82959b] hover:text-white'
                }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setIsPreview(true)}
              className={`px-4 py-2 text-sm font-bold border-none cursor-pointer bg-transparent transition-colors ${isPreview
                  ? 'text-white border-b-2 border-white -mb-[2px]'
                  : 'text-[#82959b] hover:text-white'
                }`}
            >
              Preview
            </button>
          </div>

          {/* Body Textarea or Preview */}
          {isPreview ? (
            <div className="min-h-[160px] mb-4 text-sm text-[#d7dadc] leading-relaxed prose prose-invert max-w-none">
              {body ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-3 mt-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold text-white mb-2 mt-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-bold text-white mb-2 mt-2">{children}</h3>,
                    p: ({ children }) => <p className="text-[#d7dadc] mb-3 leading-relaxed">{children}</p>,
                    strong: ({ children }) => <strong className="text-white font-bold">{children}</strong>,
                    em: ({ children }) => <em className="text-[#d7dadc] italic">{children}</em>,
                    code: ({ inline, children }) => inline
                      ? <code className="bg-[#1A282D] text-[#46d160] px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                      : <pre className="bg-[#1A282D] text-[#46d160] p-4 rounded-lg text-sm font-mono overflow-x-auto mb-3"><code>{children}</code></pre>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-[#82959b] pl-4 text-[#82959b] italic mb-3">{children}</blockquote>,
                    ul: ({ children }) => <ul className="list-disc list-inside text-[#d7dadc] mb-3 space-y-1 pl-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside text-[#d7dadc] mb-3 space-y-1 pl-2">{children}</ol>,
                    li: ({ children }) => <li className="text-[#d7dadc]">{children}</li>,
                    a: ({ href, children }) => <a href={href} className="text-[#8ca4e6] hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                    img: ({ src, alt }) => <img src={src} alt={alt} className="max-w-full rounded-lg my-3" />,
                    table: ({ children }) => <div className="overflow-x-auto mb-3"><table className="w-full border-collapse text-sm">{children}</table></div>,
                    th: ({ children }) => <th className="border border-[#2A3236] px-3 py-2 text-left text-[#d7dadc] font-bold bg-[#1A282D]">{children}</th>,
                    td: ({ children }) => <td className="border border-[#2A3236] px-3 py-2 text-[#d7dadc]">{children}</td>,
                    hr: () => <hr className="border-[#2A3236] my-4" />,
                  }}
                >
                  {body}
                </ReactMarkdown>
              ) : (
                <p className="text-[#82959b] italic">Nothing to preview.</p>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent border-none text-base text-[#d7dadc] outline-none placeholder:text-[#82959b] resize-y min-h-[160px] leading-relaxed mb-4 font-sans"
              placeholder="Share the details... (supports **bold**, *italic*, # headings, - lists, > quotes, `code`)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          )}

          {/* Toolbar */}
          <div className="flex items-center gap-4 text-[#82959b] mb-4">
            {TOOLBAR_ICONS.map((item, idx) => (
              item.isSeparator ? (
                <span key={idx} className="w-[1px] h-4 bg-[#2A3236] mx-1"></span>
              ) : item.isSpacer ? (
                <span key={idx} className="flex-1"></span>
              ) : (
                <button
                  key={idx}
                  type="button"
                  className="hover:bg-[#272729] rounded p-1 transition-colors flex items-center justify-center bg-transparent border-none cursor-pointer"
                  onClick={() => handleFormat(item.id)}
                  title={item.title || item.id}
                >
                  {item.icon}
                </button>
              )
            ))}
          </div>

          {/* Hidden media inputs */}
          <input
            type="file"
            ref={imageInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => handleMediaUpload(e, 'image')}
          />
          <input
            type="file"
            ref={videoInputRef}
            className="hidden"
            accept="video/*"
            onChange={(e) => handleMediaUpload(e, 'video')}
          />

          <div className="w-full h-[1px] bg-[#2A3236] mb-4"></div>

          {/* Bottom Actions */}
          <div className="flex justify-end items-center gap-3 relative">
            {draftSaved && (
              <span className="text-sm text-[#46d160] font-bold absolute right-[180px] animate-fade-in">
                Draft saved!
              </span>
            )}
            <button
              type="button"
              className="px-5 py-2 rounded-full font-bold text-sm bg-[#1A282D] text-[#82959b] cursor-pointer border-none transition-colors hover:bg-[#2A3236]"
              onClick={handleSaveDraft}
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
