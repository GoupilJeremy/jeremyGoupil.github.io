import SceneSetup from "./components/Scene/SceneSetup";
import NavigationBar from "./components/UI/NavigationBar";
import EventPanel from "./components/UI/EventPanel";
import Timeline from "./components/Timeline/Timeline";

export default function App() {
  return (
    <div className="relative w-full h-full">
      <NavigationBar />
      <SceneSetup />
      <EventPanel />
      <Timeline />
    </div>
  );
}
