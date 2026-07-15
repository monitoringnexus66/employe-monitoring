import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Room, Track } from "livekit-client";
import "./App.css";

interface ActiveApp {
  app_name: string;
  window_title: string;
}
interface Screenshot {
  base64_image: string;
}
interface Workspace {
  id: string;
  name: string;
  screenshotInterval: number;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [roomRef, setRoomRef] = useState<Room | null>(null);
  const [cctvError, setCctvError] = useState("");

  const [tenantId, setTenantId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceName, setActiveWorkspaceName] = useState("");
  const [screenshotInterval, setScreenshotInterval] = useState(60);

  // Branding State
  const [appName, setAppName] = useState("NexusTrack");
  const [appLogo, setAppLogo] = useState<string | null>(null);

  useEffect(() => {
    // Fetch Global Platform Branding
    fetch("https://employe-monitoring.vercel.app/api/superadmin/branding")
      .then(res => res.json())
      .then(data => {
        if (data.appName) setAppName(data.appName);
        if (data.logoBase64) setAppLogo(data.logoBase64);
        
        // Dynamically update window title if using Tauri Window API
        import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
          getCurrentWindow().setTitle(`${data.appName || "NexusTrack"} Agent`);
        }).catch(() => {});
      })
      .catch(console.error);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      let machineId = localStorage.getItem("machineId");
      if (!machineId) {
        machineId = "device_" + Math.random().toString(36).substring(2, 11);
        localStorage.setItem("machineId", machineId);
      }
      
      const osInfo = navigator.userAgent.includes("Windows") ? "Windows" : navigator.userAgent.includes("Mac") ? "macOS" : navigator.userAgent.includes("Linux") ? "Linux" : "Unknown OS";
      
      const res = await fetch('https://employe-monitoring.vercel.app/api/agent/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, machineId, osInfo })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setDeviceId(data.deviceId);
      setEmployeeName(data.name);
      setWorkspaces(data.workspaces);
      
      if (data.workspaces.length === 1) {
         selectWorkspace(data.workspaces[0]);
      }
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectWorkspace = (workspace: Workspace) => {
    setTenantId(workspace.id);
    setActiveWorkspaceName(workspace.name);
    setScreenshotInterval(workspace.screenshotInterval);
    setIsAuthenticated(true);
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchActiveWindow = async () => {
      try {
        const app = await invoke<ActiveApp>("get_active_app");
        fetch('https://employe-monitoring.vercel.app/api/agent/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId,
            tenantId,
            appName: app.app_name,
            windowTitle: app.window_title,
            durationSeconds: 5,
            isIdle: false
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.screenshotInterval !== undefined) {
             setScreenshotInterval(data.screenshotInterval);
          }
        })
        .catch(err => console.error("Telemetry failed:", err));
        
      } catch (e) {
        console.error("Failed to get active window:", e);
      }
    };

    fetchActiveWindow();
    const interval = setInterval(fetchActiveWindow, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, deviceId, tenantId]);

  // LiveKit CCTV Stream
  const startLiveCCTV = async () => {
    if (!isAuthenticated || !tenantId) return;
    try {
      const res = await fetch(`https://employe-monitoring.vercel.app/api/livekit/token?room=${tenantId}&isAgent=true&name=${encodeURIComponent(employeeName)}`);
      const data = await res.json();
      if (data.token && data.url) {
        const room = new Room();
        setRoomRef(room);
        await room.connect(data.url, data.token);

        try {
          // Bypassing WebKit getDisplayMedia by creating a custom Canvas stream driven by Rust!
          // Get the first frame to initialize the exact resolution of the screen
          const firstScreenshot = await invoke<Screenshot>("take_screenshot");
          const firstImg = new Image();
          await new Promise((resolve, reject) => {
            firstImg.onload = resolve;
            firstImg.onerror = reject;
            firstImg.src = firstScreenshot.base64_image;
          });

          // WebKit aggressively freezes any canvas that is 1x1 pixel or transparent!
          // We MUST make it a reasonable size and opacity: 1, but we can hide it behind the main UI.
          const canvas = document.createElement("canvas");
          canvas.width = firstImg.width;
          canvas.height = firstImg.height;
          canvas.style.position = "fixed";
          canvas.style.bottom = "10px";
          canvas.style.right = "10px";
          canvas.style.width = "200px";
          canvas.style.height = "auto";
          canvas.style.zIndex = "-9999"; // Hidden behind the root UI
          canvas.style.opacity = "1";
          canvas.style.pointerEvents = "none";
          document.body.appendChild(canvas);
          
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("Could not create canvas context");
          ctx.drawImage(firstImg, 0, 0);

          // Use default captureStream (event-driven) because WebKit often freezes on fixed FPS streams
          const mediaStream = canvas.captureStream(); 
          const videoTrack = mediaStream.getVideoTracks()[0];

          await room.localParticipant.publishTrack(videoTrack, { source: Track.Source.ScreenShare });
          
          console.log("Started custom Rust-driven screen sharing");
          setIsBroadcasting(true);

          // Push frames from Rust into the Canvas
          const loop = async () => {
            while (room.state === "connected") {
              try {
                const screenshot = await invoke<Screenshot>("take_screenshot");
                const img = new Image();
                
                await new Promise((res, rej) => {
                  img.onload = res;
                  img.onerror = rej;
                  img.src = screenshot.base64_image;
                });

                if (canvas.width !== img.width) canvas.width = img.width;
                if (canvas.height !== img.height) canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Add a tiny pulsating green dot in the corner so you know the video stream itself is live
                ctx.fillStyle = Date.now() % 1000 < 500 ? "#0f0" : "transparent";
                ctx.beginPath();
                ctx.arc(canvas.width - 20, 20, 10, 0, Math.PI * 2);
                ctx.fill();

              } catch (e) {
                console.error("Frame dropped:", e);
              }
              // Throttle to roughly 2-3 FPS to prevent overloading the native Rust image encoder
              await new Promise(r => setTimeout(r, 400)); 
            }
          };
          loop();

        } catch (err: any) {
          setCctvError("SCREEN SHARE ERROR: " + err.message);
        }
      } else {
        setCctvError("LIVEKIT TOKEN ERROR: " + JSON.stringify(data));
      }
    } catch (err: any) {
      setCctvError("LIVEKIT API ERROR: " + err.message);
    }
  };

  useEffect(() => {
    return () => {
      if (roomRef) {
        roomRef.disconnect();
      }
    };
  }, [roomRef]);

  useEffect(() => {
    if (!isAuthenticated || screenshotInterval === 0) return;

    const fetchScreenshot = async () => {
      try {
        const screenshot = await invoke<Screenshot>("take_screenshot");
        fetch('https://employe-monitoring.vercel.app/api/agent/screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId,
            tenantId,
            s3Url: screenshot.base64_image,
            activityLevel: 100
          })
        }).catch(err => console.error("Screenshot upload failed:", err));
      } catch (e) {
        console.error("Screenshot failed:", e);
      }
    };

    fetchScreenshot();
    const interval = setInterval(fetchScreenshot, screenshotInterval * 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, deviceId, tenantId, screenshotInterval]);

  if (!isAuthenticated && workspaces.length > 1) {
    return (
      <main className="app-container">
        <div className="header">
          <h1>Select Workspace</h1>
          <p>Where are you clocking in today?</p>
        </div>
        
        <div>
          {workspaces.map(ws => (
            <button key={ws.id} onClick={() => selectWorkspace(ws)} className="workspace-btn">
              <span style={{ fontSize: '1.2rem' }}>🏢</span>
              <span>{ws.name}</span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="app-container">
        <div className="header">
          {appLogo && <img src={appLogo} alt="Logo" style={{ width: '48px', height: '48px', marginBottom: '1rem', borderRadius: '12px' }} />}
          <h1>{appName}</h1>
          <p>Sign in to connect this device</p>
        </div>

        <form onSubmit={handleLogin}>
          {loginError && <div className="error-msg">{loginError}</div>}
          
          <div className="form-group">
            <label>Work Email</label>
            <input 
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              className="input-field"
              placeholder="alice@company.com"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>
          
          <button type="submit" disabled={isLoading} className="btn btn-primary">
            {isLoading ? "Authenticating..." : "Sign In & Connect"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="app-container" style={{ textAlign: "center" }}>
      <div className="header">
        {appLogo && <img src={appLogo} alt="Logo" style={{ width: '48px', height: '48px', marginBottom: '1rem', borderRadius: '12px', display: 'inline-block' }} />}
        <h1>{appName}</h1>
        <p>Running stealthily in background</p>
      </div>
      
      <div className="glass-card">
        <p style={{ margin: "0 0 0.5rem 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>AUTHENTICATED AS</p>
        <p style={{ margin: "0 0 1rem 0", fontSize: "1.2rem", fontWeight: "600", color: "white" }}>{employeeName}</p>
        
        <div style={{ padding: "0.75rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
          <p style={{ margin: "0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Active Workspace</p>
          <p style={{ margin: "0.25rem 0 0 0", color: "white", fontWeight: "500" }}>{activeWorkspaceName}</p>
        </div>
        
        {workspaces.length > 1 && (
          <button onClick={() => setIsAuthenticated(false)} className="btn btn-secondary" style={{ marginTop: "1rem" }}>
            🔄 Switch Workspace
          </button>
        )}
      </div>

      <div className="status-badge">
        <div className="pulse"></div>
        Tracking Active
      </div>
      
      {cctvError && (
        <div className="error-msg" style={{ marginTop: "1rem", fontSize: "0.8rem" }}>
          {cctvError}
        </div>
      )}

      <div style={{ marginTop: "1rem" }}>
        {!isBroadcasting ? (
          <button onClick={startLiveCCTV} className="btn btn-primary" style={{ width: "100%" }}>
            🎥 Start CCTV Broadcast
          </button>
        ) : (
          <div className="status-badge" style={{ background: "rgba(0, 255, 0, 0.1)", color: "#0f0", borderColor: "rgba(0, 255, 0, 0.3)" }}>
            <div className="pulse" style={{ background: "#0f0" }}></div>
            CCTV Broadcast Active
          </div>
        )}
      </div>
      
      <div style={{ marginTop: "2rem" }}>
        <button 
          onClick={() => { setIsAuthenticated(false); setWorkspaces([]); }}
          style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline" }}
        >
          Sign Out of {appName}
        </button>
      </div>
    </main>
  );
}

export default App;
