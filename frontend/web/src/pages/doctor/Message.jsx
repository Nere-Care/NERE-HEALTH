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

export default function Messages() {
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
    <div className="min-h-screen bg-[#F8F8F8] p-3 md:p-6">

      {/* MAIN CONTAINER */}
      <div className="md:ml-[260px] pt-[70px] md:pt-[90px]">

        <div className="
          h-[100vh] md:h-[85vh]
          flex bg-white md:rounded-3xl shadow-xl overflow-hidden relative
        ">

          {/* ================= LEFT SIDEBAR ================= */}
          <div className={`
            w-full md:w-[360px]
            bg-[#F7F9FC]
            flex flex-col border-r border-gray-300
            ${selectedChat !== null ? "hidden md:flex" : "flex"}
          `}>

            {/* HEADER SEARCH */}
            <div className="p-4 md:p-5 bg-white">
              <h1 className="text-lg md:text-xl font-semibold">
                Chats
              </h1>

              <div className="mt-3 flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-gray-400" />
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
                />
              ))}
            </div>

            {/* FOOTER */}
            <div className="p-3 md:p-4 text-center text-green-600 text-xs border-t bg-white">
              <Lock className="w-4 h-4 inline mr-1" />
              End-to-end encrypted
            </div>
          </div>

          {/* ================= CHAT AREA ================= */}
          <div className={`
            flex-1 flex flex-col bg-[#F9FAFB]
            ${selectedChat === null ? "hidden md:flex" : "flex"}
          `}>

            {/* HEADER */}
            <div
              className="px-4 md:px-6 py-3 md:py-4 bg-white border-b border-gray-300 flex justify-between items-center"
              onClick={() => setShowFiles(true)}
            >
              <div className="flex items-center gap-3">

                {/* BACK BUTTON MOBILE */}
                <button
                  className="md:hidden text-gray-600 text-xl"
                  onClick={() => setSelectedChat(null)}
                >
                  ←
                </button>

                <img
                  src={current.avatar}
                  className="w-9 h-9 md:w-10 md:h-10 rounded-full"
                />

                <div>
                  <p className="font-semibold text-sm md:text-base">
                    {current.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {current.role}
                  </p>
                </div>
              </div>

              <MoreVertical className="w-5 h-5 text-gray-500" />
            </div>

            {/* MESSAGES */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">

              {current.messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`
                      px-3 md:px-4 py-2 rounded-2xl text-sm
                      max-w-[85%] md:max-w-[70%]
                      ${msg.fromMe ? "bg-blue-600 text-white" : "bg-white"}
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
            <div className="p-3 md:p-4 bg-white border-t border-gray-300 flex items-center gap-2 sticky bottom-0">

              <Smile className="w-5 h-5 text-gray-500" />
              <Paperclip className="w-5 h-5 text-gray-500" />
              <Image className="w-5 h-5 text-gray-500" />

              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-gray-100 px-3 py-2 rounded-xl outline-none text-sm"
                placeholder="Write message..."
              />

              <button className="bg-blue-600 text-white p-2 rounded-xl">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ================= FILE PANEL ================= */}
          {showFiles && (
            <div className="
              absolute right-0 top-0 h-full
              w-full md:w-[320px]
              bg-white shadow-2xl border-l p-5
            ">

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
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
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

          <div className="bg-white w-[95%] md:w-[500px] rounded-xl p-4 relative">

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