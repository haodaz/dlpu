interface AudienceMessage {
  type: string;
  text: string;
  username?: string;
  timestamp: number;
  isCreator?: boolean;
}

interface AudienceRoom {
  presence: Map<string, number>;
  messages: AudienceMessage[];
}

const activeBroadcasts: Record<string, AudienceRoom> = {};

export function getAudienceRoom(id: string): AudienceRoom {
  if (!activeBroadcasts[id]) {
    activeBroadcasts[id] = {
      presence: new Map(),
      messages: []
    };
  }
  return activeBroadcasts[id];
}

export const lastMessageTime = new Map<string, number>();