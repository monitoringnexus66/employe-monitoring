import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
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

  const [tenantId, setTenantId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceName, setActiveWorkspaceName] = useState("");
  const [screenshotInterval, setScreenshotInterval] = useState(60);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      const machineId = "device_" + Math.random().toString(36).substr(2, 9);
      
      const res = await fetch('https://employe-monitoring.vercel.app/api/agent/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, machineId })
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
        }).catch(err => console.error("Telemetry failed:", err));
        
      } catch (e) {
        console.error("Failed to get active window:", e);
      }
    };

    fetchActiveWindow();
    const interval = setInterval(fetchActiveWindow, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated, deviceId, tenantId]);

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
          <h1>NexusTrack</h1>
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
        <h1>NexusTrack</h1>
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
      
      <div style={{ marginTop: "2rem" }}>
        <button 
          onClick={() => { setIsAuthenticated(false); setWorkspaces([]); }}
          style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline" }}
        >
          Sign Out of NexusTrack
        </button>
      </div>
    </main>
  );
}

export default App;
