import React, { useState } from "react";
import {
  Send,
  Paperclip,
  MoreVertical,
  Smile,
  Image,
  FileText,
  X,
} from "lucide-react";

import { conversations } from "../../constants/doctors/conversationsData";
import ChatSidebar from "../../components/doctors/messages/ChatSidebar";

export default function Messages({ darkMode }) {
  const [message, setMessage] = useState("");
  const [showFiles, setShowFiles] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);

  const current =
    conversations.find((c) => c.id === selectedChat) || {
      name: "",
      role: "",
      avatar: "",
      messages: [],
      files: [],
    };

  return (
    <div
      className={`h-screen flex overflow-hidden transition
      ${darkMode ? "bg-gray-950 text-white" : "bg-gray-50 text-black"}`}
    >
      <div className="w-full flex p-2 md:p-4 gap-3">

        {/* SIDEBAR */}
        <ChatSidebar
          conversations={conversations}
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
          darkMode={darkMode}
        />

        {/* CHAT */}
        <div
          className={`flex-1 flex flex-col rounded-xl overflow-hidden border
          ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"}
          ${selectedChat === null ? "hidden md:flex" : "flex"}`}
        >
          {/* HEADER */}
          <div
            onClick={() => setShowFiles(true)}
            className={`flex justify-between items-center px-4 py-3 border-b cursor-pointer
            ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <div className="flex items-center gap-3">
              <button
                className="md:hidden"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedChat(null);
                }}
              >
                ←
              </button>

              <img
                src={current.avatar}
                className="w-10 h-10 rounded-full object-cover"
              />

              <div>
                <p className="font-semibold text-sm">{current.name}</p>
                <p className="text-xs text-gray-400">{current.role}</p>
              </div>
            </div>

            <MoreVertical className="w-5 h-5" />
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {current.messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm
                  ${
                    msg.fromMe
                      ? "bg-blue-600 text-white"
                      : darkMode
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-black"
                  }`}
                >
                  <p>{msg.text}</p>

                  {msg.files?.map((f, idx) => (
                    <div key={idx} className="mt-2">
                      {f.type === "image" ? (
                        <img
                          src={f.url}
                          className="w-28 rounded-lg cursor-pointer"
                          onClick={() => setPreviewFile(f)}
                        />
                      ) : (
                        <div
                          className="flex items-center gap-2 text-xs cursor-pointer"
                          onClick={() => setPreviewFile(f)}
                        >
                          <FileText className="w-4 h-4" />
                          {f.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* INPUT */}
          <div
            className={`flex items-center gap-2 p-3 border-t
            ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
          >
            <Smile className="w-5 h-5 cursor-pointer" />
            <Paperclip className="w-5 h-5 cursor-pointer" />
            <Image className="w-5 h-5 cursor-pointer" />

            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`flex-1 px-3 py-2 rounded-lg outline-none text-sm
              ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100"}`}
              placeholder="Write a message..."
            />

            <button className="bg-blue-600 text-white p-2 rounded-lg">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* PREVIEW */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
          <div className="bg-white p-4 rounded-xl w-[90%] md:w-[500px]">
            <X className="cursor-pointer mb-2" onClick={() => setPreviewFile(null)} />

            {previewFile.type === "image" ? (
              <img src={previewFile.url} />
            ) : (
              <a href={previewFile.url} download>
                Download file
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}