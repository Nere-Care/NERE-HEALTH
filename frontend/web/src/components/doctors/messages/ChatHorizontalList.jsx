export default function ChatHorizontalList({ conversations }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {conversations.map((chat) => (
        <div key={chat.id} className="flex flex-col items-center min-w-[60px]">
          <img
            src={chat.avatar}
            className="w-11 h-11 rounded-full border-2 border-blue-500"
          />

          <p className="text-[10px] text-center truncate w-[60px]">
            {chat.name}
          </p>
        </div>
      ))}
    </div>
  );
}