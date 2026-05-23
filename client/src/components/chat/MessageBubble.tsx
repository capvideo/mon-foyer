import { Message, getMember } from '../../types';

interface Props {
  message: Message;
  isMine: boolean;
  showAvatar?: boolean;
}

function formatTime(ts: string) {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(ts));
}

function formatDate(ts: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(new Date(ts));
}

export function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-3">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400 font-medium">{formatDate(date)}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

export function MessageBubble({ message, isMine, showAvatar }: Props) {
  const member = getMember(message.member_id);
  const isAction = message.type === 'action';

  if (isAction) {
    let metadata: any = {};
    try { metadata = JSON.parse(message.metadata || '{}'); } catch {}

    return (
      <div className="flex justify-center my-2">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs text-amber-700 max-w-xs text-center">
          <span className="font-medium">{member?.name}</span> · {message.content}
          {metadata.amount && (
            <span className="block font-bold mt-0.5">
              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(metadata.amount)}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 my-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {showAvatar && !isMine ? (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 mb-1"
          style={{ backgroundColor: member?.color }}
        >
          {member?.emoji}
        </div>
      ) : (
        <div className="w-7 flex-shrink-0" />
      )}

      {/* Bubble */}
      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {showAvatar && !isMine && (
          <span className="text-xs text-gray-400 mb-1 ml-1">{member?.name}</span>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
            isMine
              ? 'rounded-br-sm text-white'
              : 'rounded-bl-sm bg-gray-100 text-gray-800'
          }`}
          style={isMine ? { backgroundColor: member?.color } : {}}
        >
          {message.content}
        </div>
        <span className="text-[10px] text-gray-400 mt-0.5 mx-1">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}
