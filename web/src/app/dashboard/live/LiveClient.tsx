"use client";

import { useEffect, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, useTracks, VideoTrack } from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { Loader2, MonitorPlay } from "lucide-react";

export default function LiveClient({ tenantId }: { tenantId: string }) {
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");

  const [connectKey, setConnectKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    fetch(`/api/livekit/token?room=${tenantId}&isAgent=false`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.token) {
          setToken(data.token);
          setUrl(data.url);
        }
      })
      .catch(err => console.error("Error fetching CCTV token:", err));

    return () => {
      isMounted = false;
    };
  }, [tenantId, connectKey]);

  const handleReconnect = () => {
    setToken("");
    setConnectKey(prev => prev + 1);
  };

  if (token === "") {
    return (
      <div className="flex flex-col items-center justify-center h-96 glass-card rounded-xl">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-white font-medium">Connecting to Live CCTV Server...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      key={connectKey}
      video={false}
      audio={false}
      token={token}
      serverUrl={url}
      connect={true}
      data-lk-theme="default"
      style={{ height: '70vh' }}
      className="glass-card rounded-xl overflow-hidden"
      onDisconnected={handleReconnect}
      onError={(err) => {
        console.error("LiveKit room error:", err);
        handleReconnect();
      }}
    >
      <CCTVGrid onRefresh={handleReconnect} />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function CCTVGrid({ onRefresh }: { onRefresh?: () => void }) {
  const tracks = useTracks(
    [
      { source: Track.Source.ScreenShare, withPlaceholder: false },
      { source: Track.Source.Camera, withPlaceholder: false } // Some might publish as camera
    ],
    { onlySubscribed: false }
  );

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <MonitorPlay className="w-16 h-16 text-gray-500 mb-4" />
        <h2 className="text-xl font-semibold text-white">No Active Screens</h2>
        <p className="text-gray-400 mt-2 mb-4">Waiting for agents to start broadcasting...</p>
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Refresh Stream
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tracks.map((trackRef) => (
          <div key={trackRef.participant.identity} className="relative rounded-lg overflow-hidden border border-white/10 bg-black group aspect-video flex items-center justify-center">
            <VideoTrack trackRef={trackRef as any} className="w-full h-full object-contain" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white font-medium">{trackRef.participant.name || trackRef.participant.identity.replace('agent-', 'Device ')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
