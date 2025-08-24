import React, { useState, useEffect } from "react";
import axios from "axios";

function Chat({ uploadedDoc }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState('general'); // 'general' or 'document'

  // Update chat mode based on uploaded document
  useEffect(() => {
    setChatMode(uploadedDoc ? 'document' : 'general');
    // Clear previous answer when switching modes
    if (answer) {
      setAnswer("");
      setSources([]);
    }
  }, [uploadedDoc]);

  const askQuestion = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    setAnswer("⏳ Thinking...");
    setSources([]);

    try {
      let response;
      
      if (chatMode === 'document' && uploadedDoc) {
        // Use RAG query endpoint for document-based questions
        response = await axios.post("http://localhost:5000/query", {
          question
        });
        setAnswer(response.data.answer);
        setSources(response.data.hits || []);
      } else {
        // Use general chat endpoint for regular conversation
        response = await axios.post("http://localhost:5000/chat", {
          message: question
        });
        setAnswer(response.data.reply);
        setSources([]); // No sources for general chat
      }
    } catch (err) {
      console.error(err);
      setAnswer("❌ Error getting answer. Please try again.");
      setSources([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      askQuestion();
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl shadow-2xl border border-purple-500/20 backdrop-blur-sm">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,119,198,0.15),transparent)] animate-pulse"></div>
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl animate-pulse"></div>
      <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      
      <div className="relative p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              AI Assistant
            </h2>
            
            {/* Mode Indicator */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-300 ${
              chatMode === 'document' 
                ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}>
              {chatMode === 'document' ? 'Document Mode' : 'General Chat'}
            </div>
          </div>
          
          <p className="text-slate-400">
            {chatMode === 'document' 
              ? 'Ask me anything about your uploaded document'
              : 'Ask me anything and I\'ll help you out'
            }
          </p>
        </div>

        
      

        {/* Input Section */}
        <div className="relative mb-6">
          <textarea
            className="w-full p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl 
                     text-white placeholder-slate-400 resize-none transition-all duration-300
                     focus:border-purple-400/50 focus:ring-2 focus:ring-purple-400/20 focus:bg-white/10
                     hover:border-white/20 hover:bg-white/[0.07]"
            rows="4"
            placeholder={
              chatMode === 'document' 
                ? "Ask me about your document... What would you like to know?"
                : "Type your message here... I'm ready to help!"
            }
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          
          {/* Floating action button */}
          <button
            onClick={askQuestion}
            disabled={!question.trim() || isLoading}
            className="absolute bottom-4 right-4 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full 
                           flex items-center justify-center shadow-lg transform transition-all duration-200 
                           group-hover:scale-110 group-hover:shadow-purple-500/50 group-active:scale-95
                           group-disabled:hover:scale-100">
                {isLoading ? (
                  <svg className="w-5 h-5 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </div>
              {!isLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full 
                             opacity-0 group-hover:opacity-20 group-hover:animate-ping"></div>
              )}
            </div>
          </button>

          {/* Keyboard hint */}
          <div className="absolute -bottom-6 right-0 text-xs text-slate-500">
            Ctrl + Enter to send
          </div>
        </div>

        {/* Answer Section */}
        {answer && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            {/* Answer Card */}
            <div className="relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className={`absolute top-0 left-0 w-full h-1 ${
                chatMode === 'document' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500'
              }`}></div>
              
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg ${
                    chatMode === 'document' 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                      : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  }`}>
                    {chatMode === 'document' ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                    {chatMode === 'document' ? 'Document Answer' : 'Assistant Reply'}
                    {answer === "⏳ Thinking..." && (
                      <div className="ml-3 flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                      </div>
                    )}
                  </h3>
                  <div className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {answer}
                  </div>
                </div>
              </div>
            </div>

            {/* Sources Section - Only for document mode */}
            {sources.length > 0 && chatMode === 'document' && (
              <div className="relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6
                           animate-in slide-in-from-bottom-4 duration-700 delay-200">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg 
                                 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-white mb-4">Sources from Document</h4>
                    <div className="space-y-3">
                      {sources.map((hit, index) => (
                        <div key={hit.id} 
                             className="group flex items-center space-x-3 p-3 rounded-lg bg-white/5 
                                      border border-white/5 hover:border-white/10 hover:bg-white/10 
                                      transition-all duration-200 cursor-pointer"
                             style={{ animationDelay: `${index * 100}ms` }}>
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 
                                         rounded-md flex items-center justify-center text-white text-sm font-medium">
                              {index + 1}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-200 font-medium truncate">
                                {hit.metadata?.source || 'Unknown source'}
                              </span>
                              {hit.metadata?.chunk && (
                                <span className="text-slate-400 text-sm flex-shrink-0">
                                  #{hit.metadata.chunk}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Clear conversation button */}
            <div className="flex justify-center pt-4">
              <button
                onClick={() => {
                  setQuestion("");
                  setAnswer("");
                  setSources([]);
                }}
                className="text-slate-400 hover:text-slate-200 text-sm transition-colors duration-200 
                         flex items-center space-x-2 group"
              >
                <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" 
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Clear Conversation</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;