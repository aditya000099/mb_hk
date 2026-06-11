import { create } from 'zustand'

const useChatStore = create((set) => ({
  isOpen: false,
  activeFriend: null,
  openChat: (friend = null) => set({ isOpen: true, activeFriend: friend }),
  closeChat: () => set({ isOpen: false, activeFriend: null }),
  setActiveFriend: (friend) => set({ activeFriend: friend })
}))

export default useChatStore
