import React, { useState } from "react";
import {
  Send,
  Paperclip,
  MoreVertical,
  Smile,
  Image,
  FileText,
  X,
  Download,
} from "lucide-react";

import { conversations } from "../../constants/doctors/conversationsData";
import ChatSidebar from "../../components/doctors/messages/ChatSidebar";

export default function Messages({ darkMode }) {

  const [message, setMessage] = useState("");
  const [showFiles, setShowFiles] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);

  // ✅ FIX IMPORTANT (id et non index)
  const current = conversations.find(c => c.id === selectedChat) || {
      name: "",
      role: "",
      avatar: "",
      messages: [],
      files: [],
    };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}>

      <div className="p-2 sm:p-3 md:p-6">

        <div className={`
          h-[100dvh] md:h-[85vh]
          flex overflow-hidden relative
          rounded-none md:rounded-2xl lg:rounded-3xl shadow-xl
          ${darkMode ? "bg-gray-800" : "bg-white"}
        `}>

          {/* SIDEBAR */}
          <ChatSidebar
            conversations={conversations}
            selectedChat={selectedChat}
            setSelectedChat={setSelectedChat}
            darkMode={darkMode}
          />

          {/* CHAT */}
          <div className={`
            flex-1 flex flex-col
            ${darkMode ? "bg-gray-900" : "bg-[#F9FAFB]"}
            ${selectedChat === null ? "hidden md:flex" : "flex"}
          `}>

            {/* HEADER */}
            <div className={` md:px-6 py-3 md:py-4   px-3 sm:px-4 md:px-6 py-3 border-b flex justify-between items-center
              ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}
            `}
              onClick={() => setShowFiles(true)}
            >
              <div className="flex items-center gap-3">

                <button className="md:hidden text-xl" onClick={() => setSelectedChat(null)}>
                  ←
                </button>

                <img src={current.avatar} className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover" />

                <div>
                  <p className="font-semibold text-sm md:text-base">{current.name}</p>
                  <p className="text-xs text-gray-400">{current.role}</p>
                </div>
              </div>

              <MoreVertical className="w-5 h-5" />
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto overscroll-contain pb-24 p-4 md:p-6 space-y-4 pb-20  sm:p-4 md:p-6  md:space-y-4 scroll-smooth">

              {current.messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                  <div className={`
                    px-3 md:px-4 py-2 rounded-2xl text-sm
                    max-w-[85%] sm:max-w-[75%] md:max-w-[70%]
                    ${msg.fromMe
                      ? "bg-blue-600 text-white"
                      : darkMode
                        ? "bg-gray-700 text-white"
                        : "bg-white text-black"
                    }
                  `}>
                    <p>{msg.text}</p>

                    {msg.files?.map((f, idx) => (
                      <div key={idx} className="mt-2">
                        {f.type === "image" ? (
                          <img
                            src={f.url}
                            className="rounded-lg w-24 sm:w-28 md:w-32 cursor-pointer"
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
            <div className={`p-2 sm:p-3 md:p-4 border-t flex items-center gap-2 sticky bottom-0
              ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}
            `}>
              <Smile className="w-5 h-5" />
              <Paperclip className="w-5 h-5" />
              <Image className="w-5 h-5" />

              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-xl text-sm outline-none
                  ${darkMode ? "bg-gray-700 text-white" : "bg-gray-100"}
                `}
                placeholder="Write message..."
              />

              <button className="bg-blue-600 text-white p-2 rounded-xl">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* FILE PANEL */}
{showFiles && (
  <>
    {/* OVERLAY */}
    <div
      className="fixed inset-0 bg-black/40 z-30"
      onClick={() => setShowFiles(false)}
    />

    {/* PANEL */}
    <div
      className={`
        fixed right-0 top-0 h-full w-full md:w-[320px]
        z-40 p-4 space-y-4 overflow-y-auto
        transform transition-transform duration-300
        ${darkMode ? "bg-gray-800 text-white" : "bg-white text-black"}
      `}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg">Shared files</h2>
        <X
          className="cursor-pointer"
          onClick={() => setShowFiles(false)}
        />
      </div>

      {/* FILE LIST */}
      <div className="space-y-3">
        {current.files?.length === 0 && (
          <p className="text-sm text-gray-400">No files available</p>
        )}

        {current.files?.map((f, i) => (
          <div
            key={i}
            className={`
              flex items-center justify-between p-3 rounded-xl
              ${darkMode ? "bg-gray-700" : "bg-gray-100"}
            `}
          >
            {/* LEFT: FILE INFO */}
            <div
              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
              onClick={() => setPreviewFile(f)}
            >
              {f.type === "image" ? (
                <Image className="w-5 h-5 text-blue-500" />
              ) : (
                <FileText className="w-5 h-5 text-red-500" />
              )}

              <span className="text-sm truncate">{f.name}</span>
            </div>

            {/* RIGHT: ACTIONS */}
            <div className="flex items-center gap-2 ml-3">

              {/* VIEW */}
              <button
                onClick={() => setPreviewFile(f)}
                className="text-xs px-2 py-1 rounded-md bg-blue-500 text-white active:scale-95"
              >
                View
              </button>

              {/* DOWNLOAD */}
              <a
                href={f.url}
                download
                className="text-xs px-2 py-1 rounded-md bg-green-500 text-white active:scale-95"
              >
                Download
              </a>

            </div>
          </div>
        ))}
      </div>
    </div>
  </>
)}
        </div>
      </div>

      {/* PREVIEW */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center max-h-[80vh] overflow-auto">
          <div className="bg-white p-4 rounded-xl w-[95%] md:w-[500px]">
            <X onClick={() => setPreviewFile(null)} />
            {previewFile.type === "image"
              ? <img src={previewFile.url} />
              : <a href={previewFile.url} download>Download</a>}
          </div>
        </div>
      )}
    </div>
  );
}