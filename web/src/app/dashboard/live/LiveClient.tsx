"use client";

import { useEffect, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, useTracks, VideoTrack } from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { Loader2, MonitorPlay } from "lucide-react";

export default function LiveClient({ tenantId }: { tenantId: string }) {
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    fetch(`/api/livekit/token?room=${tenantId}&isAgent=false`)
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          setToken(data.token);
          setUrl(data.url);
        }
      });
  }, [tenantId]);

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
      video={false}
      audio={false}
      token={token}
      serverUrl={url}
      data-lk-theme="default"
      style={{ height: '70vh' }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <CCTVGrid />
      <RoomAudioRenderer />
    </LiveKitRoom>
  );
}

function CCTVGrid() {
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
        <p className="text-gray-400 mt-2">Waiting for agents to start broadcasting...</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full auto-rows-fr">
        {tracks.map((trackRef) => (
          <div key={trackRef.participant.identity} className="relative rounded-lg overflow-hidden border border-white/10 bg-black group">
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
