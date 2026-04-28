import React, { useState } from "react";
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  Lock,
  Smile,
  Image,
  FileText,
  X,
  Download,
} from "lucide-react";

import { conversations } from "../../constants/doctors/conversationsData";
import ConversationItem from "../../components/doctors/conversation/ConversationItem";

export default function Messages({ darkMode }) {
  const [selectedChat, setSelectedChat] = useState(0);
  const [message, setMessage] = useState("");
  const [showFiles, setShowFiles] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  const current = conversations[selectedChat] || {
    name: "",
    role: "",
    avatar: "",
    messages: [],
    files: [],
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      <div className="p-3 sm:p-4 md:p-6">

        <div
          className={`
            h-[100vh] md:h-[85vh]
            flex overflow-hidden relative rounded-2xl md:rounded-3xl shadow-xl
            transition-colors duration-300
            ${darkMode ? "bg-gray-800" : "bg-white"}
          `}
        >

          {/* ================= LEFT SIDEBAR ================= */}
          <div
            className={`
              w-full md:w-[360px]
              flex flex-col border-r
              ${darkMode ? "bg-gray-900 border-gray-700" : "bg-[#F7F9FC] border-gray-300"}
              ${selectedChat !== null ? "hidden md:flex" : "flex"}
            `}
          >

            {/* HEADER SEARCH */}
            <div
              className={`p-4 md:p-5 ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h1 className="text-lg md:text-xl font-semibold text-[#3b82f6]">
                Chats
              </h1>

              <div
                className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 ${
                  darkMode ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <Search
                  className={`w-4 h-4 ${
                    darkMode ? "text-gray-300" : "text-gray-400"
                  }`}
                />
                <input
                  placeholder="Search..."
                  className="w-full bg-transparent outline-none text-sm"
                />
              </div>
            </div>

            {/* LIST */}
            <div className="flex-1 overflow-y-auto space-y-2 p-2">
              {conversations.map((chat, i) => (
                <ConversationItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChat === i}
                  onClick={() => setSelectedChat(i)}
                  darkMode={darkMode}
                />
              ))}
            </div>

            {/* FOOTER */}
            <div
              className={`p-3 md:p-4 text-center text-xs border-t ${
                darkMode
                  ? "bg-gray-800 border-gray-700 text-green-400"
                  : "bg-white border-gray-200 text-green-600"
              }`}
            >
              <Lock className="w-4 h-4 inline mr-1" />
              End-to-end encrypted
            </div>
          </div>

          {/* ================= CHAT AREA ================= */}
          <div
            className={`
              flex-1 flex flex-col
              ${darkMode ? "bg-gray-900" : "bg-[#F9FAFB]"}
              ${selectedChat === null ? "hidden md:flex" : "flex"}
            `}
          >

            {/* HEADER */}
            <div
              className={`px-4 md:px-6 py-3 md:py-4 border-b flex justify-between items-center cursor-pointer ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-300"
              }`}
              onClick={() => setShowFiles(true)}
            >
              <div className="flex items-center gap-3">

                {/* BACK BUTTON MOBILE */}
                <button
                  className={`md:hidden text-xl ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                  onClick={() => setSelectedChat(null)}
                >
                  ←
                </button>

                <img
                  src={current.avatar}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover"
                />

                <div>
                  <p className="font-semibold text-sm md:text-base">
                    {current.name}
                  </p>
                  <p
                    className={`text-xs ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {current.role}
                  </p>
                </div>
              </div>

              <MoreVertical
                className={`w-5 h-5 ${
                  darkMode ? "text-gray-300" : "text-gray-500"
                }`}
              />
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">

              {current.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${
                    msg.fromMe ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`
                      px-3 md:px-4 py-2 rounded-2xl text-sm
                      max-w-[85%] md:max-w-[70%]
                      ${
                        msg.fromMe
                          ? "bg-blue-600 text-white"
                          : darkMode
                          ? "bg-gray-700 text-white"
                          : "bg-white text-black"
                      }
                    `}
                  >
                    <p>{msg.text}</p>

                    {msg.files?.map((f, idx) => (
                      <div key={idx} className="mt-2">
                        {f.type === "image" ? (
                          <img
                            src={f.url}
                            className="rounded-lg w-28 md:w-32 cursor-pointer"
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
              className={`p-3 md:p-4 border-t flex items-center gap-2 sticky bottom-0 ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-300"
              }`}
            >

              <Smile className="w-5 h-5 text-gray-500" />
              <Paperclip className="w-5 h-5 text-gray-500" />
              <Image className="w-5 h-5 text-gray-500" />

              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-xl outline-none text-sm ${
                  darkMode
                    ? "bg-gray-700 text-white"
                    : "bg-gray-100 text-black"
                }`}
                placeholder="Write message..."
              />

              <button className="bg-blue-600 text-white p-2 rounded-xl">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ================= FILE PANEL ================= */}
          {showFiles && (
            <div
              className={`absolute right-0 top-0 h-full w-full md:w-[320px] shadow-2xl border-l p-5 ${
                darkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >

              <div className="flex justify-between mb-4">
                <h2 className="font-semibold">Shared files</h2>
                <X
                  className="w-5 h-5 cursor-pointer"
                  onClick={() => setShowFiles(false)}
                />
              </div>

              <div className="space-y-3">
                {current.files?.map((f, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer ${
                      darkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                    onClick={() => setPreviewFile(f)}
                  >
                    <div className="flex items-center gap-3">
                      {f.type === "image" ? (
                        <Image className="w-5 h-5 text-blue-500" />
                      ) : (
                        <FileText className="w-5 h-5 text-red-500" />
                      )}
                      <span className="text-sm">{f.name}</span>
                    </div>

                    <Download className="w-4 h-4 text-gray-500" />
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ================= FILE PREVIEW ================= */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

          <div
            className={`w-[95%] md:w-[500px] rounded-xl p-4 relative ${
              darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`}
          >

            <X
              className="absolute top-3 right-3 cursor-pointer"
              onClick={() => setPreviewFile(null)}
            />

            {previewFile.type === "image" ? (
              <img src={previewFile.url} className="w-full rounded-lg" />
            ) : (
              <div className="text-center p-6">
                <FileText className="w-12 h-12 mx-auto text-gray-500" />
                <p className="mt-3 text-sm font-medium">
                  {previewFile.name}
                </p>

                <a
                  href={previewFile.url}
                  download
                  className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Download file
                </a>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}