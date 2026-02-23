import { DollarSign, Calendar, Users, Clock } from 'lucide-react';

export const MOCK_ARTISTS = [
  {
    id: 1,
    name: "Aria Sterling",
    handle: "@ariasterling",
    role: "Jazz Vocalist",
    rating: 4.9,
    reviews: 124,
    location: "New York, NY",
    price: 1500,
    image: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?auto=format&fit=crop&w=600&q=80",
    tags: ["Jazz", "Soul", "Corporate"],
    verified: true,
  },
  {
    id: 2,
    name: "The Neon Beats",
    handle: "@neonbeats",
    role: "Electronic Band",
    rating: 4.8,
    reviews: 89,
    location: "Los Angeles, CA",
    price: 3500,
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80",
    tags: ["EDM", "Festival", "High Energy"],
    verified: true,
  },
  {
    id: 3,
    name: "Elena Rosetti",
    handle: "@elena_violin",
    role: "Classical Violinist",
    rating: 5.0,
    reviews: 210,
    location: "Chicago, IL",
    price: 800,
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80",
    tags: ["Classical", "Wedding", "Elegant"],
    verified: true,
  },
  {
    id: 4,
    name: "Midnight Echo",
    handle: "@echo_band",
    role: "Indie Rock",
    rating: 4.7,
    reviews: 56,
    location: "Austin, TX",
    price: 1200,
    image: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&w=600&q=80",
    tags: ["Rock", "Indie", "Live"],
    verified: false,
  }
];

export const MOCK_POSTS = [
  {
    id: 1,
    user: MOCK_ARTISTS[0],
    content: "The Gala was electric last night. Thank you for the energy! 🎤✨",
    image: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?auto=format&fit=crop&w=800&q=80",
    likes: 452,
    comments: 34,
    time: "2h ago"
  },
  {
    id: 2,
    user: MOCK_ARTISTS[1],
    content: "New setup. New sounds. Tour starts in 3 days. 🎹🎚️",
    image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80",
    likes: 890,
    comments: 120,
    time: "5h ago"
  }
];

export const MOCK_REQUESTS = [
  { id: 101, event: "Summer Tech Summit", organizer: "TechGlobal Inc.", date: "Aug 15", offer: 2000, distance: "5 miles", status: "pending", type: "Corporate" },
  { id: 102, event: "Private Wedding", organizer: "Sarah & John", date: "Sep 02", offer: 1800, distance: "120 miles", status: "pending", type: "Wedding" },
  { id: 103, event: "City Music Fest", organizer: "City Council", date: "July 20", offer: 3000, distance: "2 miles", status: "pending", type: "Festival" },
];

export const MOCK_CHATS = [
  { id: 1, user: MOCK_ARTISTS[1], lastMsg: "See you at the soundcheck!", time: "10m ago", unread: 2 },
  { id: 2, user: { name: "Sarah (Manager)", image: "https://i.pravatar.cc/150?img=32" }, lastMsg: "Contract has been signed.", time: "2h ago", unread: 0 },
  { id: 3, user: MOCK_ARTISTS[3], lastMsg: "Can we borrow your amp?", time: "1d ago", unread: 0 },
];

export const MOCK_MANAGER_STATS = [
  { label: "Total Budget", value: "$45.2k", icon: DollarSign, color: "text-emerald-400", trend: "70% Spent" },
  { label: "Events", value: "03", icon: Calendar, color: "text-fuchsia-400", trend: "This Month" },
  { label: "Artists", value: "12", icon: Users, color: "text-cyan-400", trend: "Booked" },
  { label: "Pending", value: "05", icon: Clock, color: "text-yellow-400", trend: "Approvals" },
];