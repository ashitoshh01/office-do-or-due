import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../hooks/useReactQueryTasks';
import { Send, MessageSquare } from 'lucide-react';

export default function ManagerChat({ employeeId, employeeName }) {
    const { userProfile } = useAuth();
    const { messages, loading, sendMessage } = useChat(userProfile?.companyId, employeeId);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    // Auto-scroll removed as per user request to avoid page jumping
    // const scrollToBottom = () => {
    //     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // };

    // useEffect(() => {
    //     scrollToBottom();
    // }, [messages]);


    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        if (!userProfile?.uid) {
            console.error('User profile not loaded');
            return;
        }

        await sendMessage(newMessage, userProfile.uid);
        setNewMessage('');
    };


    return (
        <div className="flex flex-col h-[500px] bg-white overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                {loading ? (
                    <div className="text-center text-slate-400 text-sm mt-10">Loading conversation...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm mt-10 italic">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.senderId === userProfile.uid;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm shadow-sm ${isMe
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                    }`}>
                                    <p>{msg.text}</p>
                                    <span className={`text-[10px] block mt-1 ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-slate-100 border-0 rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm outline-none"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
