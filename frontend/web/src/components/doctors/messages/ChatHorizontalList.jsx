export default function ChatHorizontalList({ conversations, darkMode }) {
  return (
    <div
      className="
        flex gap-3 overflow-x-auto pb-3 px-1
        scroll-smooth
        scrollbar-none
      "
    >
      {conversations.map((chat) => (
        <div
          key={chat.id}
          className="
            flex flex-col items-center
            min-w-[55px] sm:min-w-[60px]
            cursor-pointer
            active:scale-95 transition
          "
        >
          <div className="relative">

            {/* AVATAR */}
            <img
              src={chat.avatar}
              className="
                w-10 h-10
                sm:w-11 sm:h-11
                md:w-12 md:h-12
                rounded-full object-cover
                border-2 border-blue-500
              "
            />

            {/* BADGE */}
            {chat.unread > 0 && (
              <span
                className="
                  absolute -top-1 -right-1
                  bg-blue-600 text-white
                  text-[9px] sm:text-[10px]
                  px-1.5 py-[1px]
                  rounded-full
                  min-w-[16px] text-center
                "
              >
                {chat.unread}
              </span>
            )}
          </div>

          {/* NAME */}
          <p
            className={`
              text-[9px] sm:text-[10px]
              mt-1 truncate
              w-[55px] sm:w-[60px]
              text-center leading-tight
              ${darkMode ? "text-gray-300" : "text-gray-600"}
            `}
          >
            {chat.name}
          </p>
        </div>
      ))}
    </div>
  );
}